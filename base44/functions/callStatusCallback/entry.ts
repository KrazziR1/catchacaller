import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Normalize phone to E.164
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

Deno.serve(async (req) => {
  try {
    // Parse query params and body
    const url = new URL(req.url);
    const businessPhone = normalizePhone(url.searchParams.get('business_phone'));
    const callerPhone = normalizePhone(url.searchParams.get('caller_phone'));

    const body = await req.text();
    const params = new URLSearchParams(body);
    const dialCallStatus = params.get('DialCallStatus'); // completed, no-answer, busy, failed
    const callSid = params.get('CallSid');

    if (!businessPhone || !callerPhone || !dialCallStatus) {
      console.warn('Missing callback parameters', { businessPhone, callerPhone, dialCallStatus });
      return new Response('OK', { status: 200 });
    }

    console.log(`Call status callback: ${dialCallStatus} from ${callerPhone} to ${businessPhone}`);

    // Only process missed calls (owner didn't answer)
    const missedStatuses = ['no-answer', 'busy', 'failed'];
    if (!missedStatuses.includes(dialCallStatus)) {
      // Call was answered - do nothing, owner is talking to lead
      console.log(`Call answered between ${callerPhone} and business owner`);
      return new Response('OK', { status: 200 });
    }

    // --- Call was NOT answered, trigger SMS fallback ---
    const base44 = createClientFromRequest(req);

    // Load business profile
    const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({ 
      phone_number: businessPhone 
    });
    const profile = profiles[0];

    if (!profile) {
      console.log(`No business profile found for ${businessPhone}`);
      return new Response('OK', { status: 200 });
    }

    // Check if already processed (idempotency)
    const existingCall = await base44.asServiceRole.entities.MissedCall.filter({
      caller_phone: callerPhone,
      created_by: profile.created_by,
    }).then(calls => calls.find(c => c.id && c.id.includes(callSid))).catch(() => null);

    if (existingCall) {
      console.log(`Call already processed: ${callSid}`);
      return new Response('OK', { status: 200 });
    }

    const now = new Date();
    const callTime = now.toISOString();

    // Check opt-out
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({ 
      phone_number: callerPhone 
    });
    if (optOuts.length > 0) {
      console.log(`${callerPhone} is opted out`);
      return new Response('OK', { status: 200 });
    }

    // Create MissedCall record
    const missedCall = await base44.asServiceRole.entities.MissedCall.create({
      caller_phone: callerPhone,
      call_time: callTime,
      status: 'new',
      estimated_value: profile.average_job_value || 500,
    });

    // Get caller state
    let callerState = 'UNKNOWN';
    try {
      const stateRes = await base44.asServiceRole.functions.invoke('getCallerState', {
        phone_number: callerPhone,
      });
      callerState = stateRes.data?.state || 'UNKNOWN';
    } catch (e) {
      console.error('State lookup failed:', e.message);
      return new Response('OK', { status: 200 });
    }

    // Create LeadConsent
    const ebsExpirationDate = new Date(callTime);
    ebsExpirationDate.setDate(ebsExpirationDate.getDate() + 90);

    await base44.asServiceRole.entities.LeadConsent.create({
      phone_number: callerPhone,
      called_at: callTime,
      consent_type: 'called_business',
      caller_state: callerState,
      ebs_expiration_date: ebsExpirationDate.toISOString(),
      explicit_sms_consent: false,
      is_valid: true,
    });

    // Check DNC
    let isDNC = false;
    try {
      const dncRes = await base44.asServiceRole.functions.invoke('checkDNC', { 
        phone_number: callerPhone 
      });
      isDNC = dncRes.data?.is_dnc || false;
    } catch (e) {
      console.warn('DNC check failed:', e.message);
    }

    if (isDNC) {
      console.log(`${callerPhone} is on DNC list`);
      return new Response('OK', { status: 200 });
    }

    // Compliance check
    let canContact = false;
    try {
      const complianceRes = await base44.asServiceRole.functions.invoke(
        'validateComplianceBeforeAnyContact',
        {
          phone_number: callerPhone,
          contact_type: 'sms',
          caller_state: callerState,
        }
      );
      canContact = complianceRes.data?.can_contact || false;
    } catch (e) {
      console.error('Compliance check failed:', e.message);
      return new Response('OK', { status: 200 });
    }

    if (!canContact) {
      console.log(`SMS blocked for ${callerPhone} - compliance`);
      return new Response('OK', { status: 200 });
    }

    // Send SMS
    const twilio = (await import('npm:twilio')).default;
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const client = twilio(accountSid, authToken);

    const name = profile.business_name;
    const personality = profile.ai_personality || 'friendly';
    const bookingLine = profile.booking_url ? ` Book here: ${profile.booking_url}` : '';
    const stopInstruction = ' Reply STOP to opt out.';

    const smsBody = personality === 'professional'
      ? `Hi, this is ${name}. We missed your call. What can we assist you with?${bookingLine}${stopInstruction}`
      : `Hi! 👋 Sorry we missed your call — we're ${name}. What can we do for you?${bookingLine}${stopInstruction}`;

    const msg = await client.messages.create({
      body: smsBody,
      from: businessPhone,
      to: callerPhone,
    });

    // Log SMS audit
    try {
      await base44.asServiceRole.functions.invoke('logSMSAudit', {
        phone_number: callerPhone,
        business_phone: businessPhone,
        message_body: smsBody,
        message_type: 'auto_response',
        status: 'sent',
        twilio_message_sid: msg.sid,
        consent_type: 'called_business',
        sent_by: 'callback',
      });
    } catch (e) {
      console.warn('Audit logging failed:', e.message);
    }

    // Update MissedCall
    await base44.asServiceRole.entities.MissedCall.update(missedCall.id, {
      status: 'sms_sent',
      sms_sent_at: now.toISOString(),
    });

    // Create or update Conversation
    const existingConv = await base44.asServiceRole.entities.Conversation.filter({
      caller_phone: callerPhone,
      created_by: profile.created_by,
    });

    if (existingConv.length === 0) {
      await base44.asServiceRole.entities.Conversation.create({
        missed_call_id: missedCall.id,
        caller_phone: callerPhone,
        status: 'active',
        pipeline_stage: 'new',
        messages: [{
          sender: 'ai',
          content: smsBody,
          timestamp: now.toISOString(),
          sms_status: 'sent',
        }],
        last_message_at: now.toISOString(),
      });
    }

    // Send owner email notification
    try {
      const users = await base44.asServiceRole.entities.User.filter({ 
        email: profile.created_by 
      });
      const profileOwner = users[0];

      if (profileOwner && profile.email_notifications_enabled) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: profileOwner.email,
          subject: `☎️ Missed Call (Call Forward Failed) — Auto-SMS Sent`,
          body: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #1e293b;">Missed Call — Owner Didn't Answer</h2>
              <p><strong>Caller:</strong> ${callerPhone}</p>
              <p><strong>Time:</strong> ${now.toLocaleString()}</p>
              <p style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px;">
                Your phone didn't answer, so we sent an automatic SMS to keep the lead warm.
                <a href="${Deno.env.get('APP_BASE_URL') || 'https://catchacaller.com'}/conversations" style="color: #3b82f6;">View conversation →</a>
              </p>
            </div>
          `,
          from_name: 'CatchACaller',
        });
      }
    } catch (e) {
      console.warn('Email notification failed:', e.message);
    }

    console.log(`✓ Missed call fallback processed for ${callerPhone}`);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('callStatusCallback error:', error.message);
    return new Response('OK', { status: 200 });
  }
});