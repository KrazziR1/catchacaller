import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

async function parseFormBody(req) {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

// Normalize any phone format to E.164 (+1XXXXXXXXXX)
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

Deno.serve(async (req) => {
  try {
    const body = await parseFormBody(req);
    const { CallStatus, From, To, CallerName } = body;

    // Validate required fields
    if (!CallStatus || !From || !To) {
      console.error('Invalid webhook payload: missing required fields');
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    console.log(`Call event: ${CallStatus} from ${From} to ${To}`);

    // Only process missed/unanswered calls
    const missedStatuses = ['no-answer', 'busy', 'failed'];
    if (!missedStatuses.includes(CallStatus)) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const callerPhone = normalizePhone(From);
    const toPhone = normalizePhone(To);
    
    // Validate phone normalization
    if (!callerPhone || !toPhone) {
      console.error('Invalid phone format: From or To could not be normalized');
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    const base44 = createClientFromRequest(req);

    // --- Check opt-out ---
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
    if (optOuts.length > 0) {
      console.log(`Skipping ${callerPhone} — opted out`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Load the correct business profile by the Twilio "To" number ---
    // This is critical for multi-tenant isolation: match on the number that was called
    const allProfiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 500);
    const profile = allProfiles.find(p => normalizePhone(p.phone_number) === toPhone);

    if (!profile) {
      console.log(`No business profile found for number ${toPhone}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    if (!profile.auto_response_enabled) {
      console.log(`Auto-response disabled for ${toPhone}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    const now = new Date();
    const callTime = now.toISOString();
    const startTime = Date.now();

    // --- Get caller state via Twilio lookup ---
    let callerState = 'UNKNOWN';
    try {
      const stateRes = await base44.asServiceRole.functions.invoke('getCallerState', {
        phone_number: callerPhone,
      });
      callerState = stateRes.data?.state || 'UNKNOWN';
    } catch (e) {
      console.error('State lookup failed - cannot determine compliance requirements:', e.message);
      // CRITICAL: Block SMS if state detection fails
      // Better to reject than risk sending to CA/NY without explicit consent
      console.log(`Blocked SMS to ${callerPhone} - state detection failure`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Create LeadConsent record with 90-day EBR expiration ---
    const ebsExpirationDate = new Date(callTime);
    ebsExpirationDate.setDate(ebsExpirationDate.getDate() + 90);

    const consent = await base44.asServiceRole.entities.LeadConsent.create({
      phone_number: callerPhone,
      called_at: callTime,
      consent_type: 'called_business',
      caller_state: callerState,
      ebs_expiration_date: ebsExpirationDate.toISOString(),
      explicit_sms_consent: false, // Will be set to true only after caller confirms
      is_valid: true,
    });

    // --- Check DNC ---
    const dncCheckRes = await base44.asServiceRole.functions.invoke('checkDNC', { phone_number: callerPhone });
    if (dncCheckRes.data?.is_dnc) {
      console.log(`${callerPhone} is on DNC list, skipping SMS`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Create MissedCall record (owned by this profile's user) ---
    const missedCall = await base44.asServiceRole.entities.MissedCall.create({
      caller_phone: callerPhone,
      caller_name: CallerName || null,
      call_time: callTime,
      status: 'new',
      estimated_value: profile.average_job_value || 500,
    });

    // --- COMPLIANCE: Validate before sending ANY SMS ---
    const complianceCheck = await base44.asServiceRole.functions.invoke(
      'validateComplianceBeforeAnyContact',
      {
        phone_number: callerPhone,
        contact_type: 'sms',
        caller_state: callerState,
      }
    );

    if (!complianceCheck.data?.can_contact) {
      console.log(
        `SMS blocked for ${callerPhone}: ${complianceCheck.data?.reason}`
      );
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- For CA/NY: Send opt-in confirmation first instead of business message ---
    const requiresExplicitConsent = ['CA', 'NY'].includes(callerState);

    if (requiresExplicitConsent && !consent.explicit_sms_consent) {
      // Send opt-in confirmation request FIRST
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const fromPhone = toPhone;
      const client = twilio(accountSid, authToken);

      const optInMessage = `Hi! This is ${profile.business_name}. Reply YES to receive SMS updates about your service request, or STOP if you prefer not to receive messages.`;

      await client.messages.create({
        body: optInMessage,
        from: fromPhone,
        to: callerPhone,
      });

      console.log(`CA/NY opt-in confirmation sent to ${callerPhone}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Build initial SMS message for non-strict states ---
    const name = profile.business_name;
    const personality = profile.ai_personality || 'friendly';
    const bookingLine = profile.booking_url ? ` Book here: ${profile.booking_url}` : '';

    // TCPA Compliance: Always include clear opt-out mechanism in initial message
    const stopInstruction = ' Reply STOP to opt out of future messages.';
    const smsBody = personality === 'professional'
      ? `Hi, this is ${name}. We missed your call and want to make sure we help you. What can we assist you with today?${bookingLine}${stopInstruction}`
      : `Hi! 👋 Sorry we missed your call — we're ${name}. We'd love to help! What can we do for you?${bookingLine}${stopInstruction}`;

    // --- Send SMS from the business's own Twilio number ---
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = toPhone; // Reply from the number they called
    const client = twilio(accountSid, authToken);

    const msg = await client.messages.create({
      body: smsBody,
      from: fromPhone,
      to: callerPhone,
    });

    // Log to audit trail
    try {
      await base44.asServiceRole.functions.invoke('logSMSAudit', {
        phone_number: callerPhone,
        business_phone: toPhone,
        message_body: smsBody,
        message_type: 'auto_response',
        status: 'sent',
        twilio_message_sid: msg.sid,
        consent_type: 'called_business',
        sent_by: 'webhook',
      });
    } catch (auditErr) {
      console.warn('Audit logging failed (non-critical):', auditErr.message);
    }

    const responseTimeMs = Date.now() - startTime;

    // --- Update MissedCall record ---
    await base44.asServiceRole.entities.MissedCall.update(missedCall.id, {
      status: 'sms_sent',
      sms_sent_at: new Date().toISOString(),
      response_time_seconds: Math.round(responseTimeMs / 1000),
    });

    // --- Create Conversation record (check for duplicates) ---
    const existingConv = await base44.asServiceRole.entities.Conversation.filter({
      caller_phone: callerPhone,
      created_by: profile.created_by,
    });
    
    // Only create if no existing conversation for this caller+owner combo
    if (existingConv.length === 0) {
      await base44.asServiceRole.entities.Conversation.create({
        missed_call_id: missedCall.id,
        caller_phone: callerPhone,
        caller_name: CallerName || null,
        status: 'active',
        pipeline_stage: 'new',
        messages: [{
          sender: 'ai',
          content: smsBody,
          timestamp: new Date().toISOString(),
          sms_status: 'sent',
        }],
        last_message_at: new Date().toISOString(),
      });
    }

    // --- Send email notification to the OWNER of this business profile ---
    // PRIVACY: Only send if they haven't explicitly disabled it
    try {
      // Find the user who created this profile
      const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
      const profileOwner = allUsers.find(u => u.email === profile.created_by);

      if (profileOwner && profile.email_notifications_enabled) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: profileOwner.email,
          subject: `📞 Missed Call from ${CallerName || callerPhone}`,
          body: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #1e293b;">New Missed Call — Auto-SMS Sent</h2>
              <p><strong>Caller:</strong> ${CallerName || 'Unknown'}</p>
              <p><strong>Phone:</strong> ${callerPhone}</p>
              <p><strong>Time:</strong> ${now.toLocaleString()}</p>
              <p><strong>Business:</strong> ${name}</p>
              <p style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px;">
                An AI SMS was sent within ${Math.round(responseTimeMs / 1000)} seconds.
                <a href="https://catchacaller.com/conversations" style="color: #3b82f6;">View conversation →</a>
              </p>
            </div>
          `,
          from_name: 'CatchACaller',
        });
      }
    } catch (emailErr) {
      console.error('Email notification failed (non-critical):', emailErr.message);
    }

    console.info(`✓ Missed call processed for ${callerPhone} → ${toPhone} (${name}), SMS sent in ${responseTimeMs}ms`);

    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error(`missedCallWebhook error:`, error.message);
    // Always return success to Twilio to prevent retries on validation errors
    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  }
});