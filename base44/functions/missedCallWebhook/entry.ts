import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

// In-memory rate limiter (5 SMS per hour per phone number)
const smsRateLimits = new Map();

function checkSMSRateLimit(phoneNumber) {
  const now = Date.now();
  const oneHour = 3600000;

  if (!smsRateLimits.has(phoneNumber)) {
    smsRateLimits.set(phoneNumber, []);
  }

  const timestamps = smsRateLimits.get(phoneNumber);
  const recent = timestamps.filter(ts => now - ts < oneHour);

  if (recent.length >= 5) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((recent[0] + oneHour - now) / 1000),
    };
  }

  recent.push(now);
  smsRateLimits.set(phoneNumber, recent);
  return { allowed: true, remaining: 5 - recent.length };
}

async function parseFormBody(req) {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function verifyTwilioRequest(signature, url, params, authToken) {
  try {
    const crypto = require('crypto');
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], '');
    const hash = crypto
      .createHmac('sha1', authToken)
      .update(url + sorted)
      .digest('Base64');
    return hash === signature;
  } catch {
    return false;
  }
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
    // Validate environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!accountSid || !authToken) {
      console.error('CRITICAL: Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
      return new Response('Config error', { status: 500, headers: { 'Content-Type': 'text/xml' } });
    }

    const body = await parseFormBody(req);
    const { CallStatus, From, To, CallerName, DialCallStatus } = body;
    const signature = req.headers.get('x-twilio-signature') || '';

    // Verify Twilio signature
    if (!verifyTwilioRequest(signature, req.url, body, authToken)) {
      console.warn('Webhook signature verification failed - unauthorized');
      return new Response('Unauthorized', { status: 401 });
    }

    // Validate required fields
    if (!CallStatus || !From || !To) {
      console.error('Invalid webhook payload: missing required fields');
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    console.log(`Call event: ${CallStatus} from ${From} to ${To}`);

    // Handle initial call attempt (before Dial)
    if (CallStatus === 'ringing' || CallStatus === 'in-progress') {
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Handle initial inbound call (before dialing owner) ---
    // If CallStatus is 'ringing' or 'in-progress' and no DialCallStatus, forward to owner
    if (CallStatus === 'in-progress' && !DialCallStatus) {
      // This is the initial inbound call - return TwiML to dial the owner
      const ownerPhone = profile.owner_phone_number;
      if (!ownerPhone) {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say>Sorry, we're unable to connect your call right now.</Say>
          </Response>`, {
          headers: { 'Content-Type': 'text/xml' },
        });
      }

      // Return TwiML that dials the owner and records call status
      const callbackUrl = `${Deno.env.get('APP_BASE_URL') || 'https://catchacaller.com'}/api/callStatusCallback?business_phone=${toPhone}&caller_phone=${From}`;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Dial callerId="${From}" statusCallbackEvent="completed" statusCallback="${callbackUrl}">
            <Number>${ownerPhone}</Number>
          </Dial>
        </Response>`;
      return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

    // Only process missed/unanswered calls (owner didn't pick up after Dial)
    const missedStatuses = ['no-answer', 'busy', 'failed'];
    if (!missedStatuses.includes(DialCallStatus || CallStatus)) {
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

    // --- Idempotency: Check if we already processed this call (within 60 seconds) ---
    // Twilio retries webhooks if they timeout. Deduplicate based on CallSid
    const callSid = body.CallSid;
    
    if (callSid) {
      const lastProcessed = await base44.asServiceRole.entities.MissedCall.filter({}).then(calls => 
        calls.find(c => c.id && c.id.includes(callSid))
      ).catch(() => null);

      if (lastProcessed) {
        console.log(`Duplicate call detected for ${callSid}, skipping`);
        return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
      }
    }
    
    const now = new Date();
    const callTime = now.toISOString();

    // --- Rate limiting: 5 SMS/hour per phone ---
    const rateLimitCheck = checkSMSRateLimit(callerPhone);
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for ${callerPhone}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Check opt-out ---
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
    if (optOuts.length > 0) {
      console.log(`Skipping ${callerPhone} — opted out`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Load the correct business profile by the Twilio "To" number ---
    // This is critical for multi-tenant isolation: match on the number that was called
    const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({ phone_number: toPhone });
    const profile = profiles[0];

    if (!profile) {
      console.log(`No business profile found for number ${toPhone}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    if (!profile.auto_response_enabled) {
      console.log(`Auto-response disabled for ${toPhone}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // Check if owner phone is configured — if not, return error TwiML
    if (!profile.owner_phone_number) {
      console.log(`No owner phone configured for ${toPhone}`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Sorry, we're unable to connect your call right now. Please try again later.</Say>
        </Response>`;
      return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

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
    let isDNC = false;
    try {
      const dncCheckRes = await base44.asServiceRole.functions.invoke('checkDNC', { phone_number: callerPhone });
      isDNC = dncCheckRes.data?.is_dnc || false;
    } catch (e) {
      console.warn('DNC check failed (non-critical):', e.message);
      isDNC = false; // Allow SMS if check fails
    }

    if (isDNC) {
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
    let canContact = false;
    let complianceReason = 'unknown';
    try {
      const complianceCheck = await base44.asServiceRole.functions.invoke(
        'validateComplianceBeforeAnyContact',
        {
          phone_number: callerPhone,
          contact_type: 'sms',
          caller_state: callerState,
        }
      );
      canContact = complianceCheck.data?.can_contact || false;
      complianceReason = complianceCheck.data?.reason || 'unknown';
    } catch (e) {
      console.error('Compliance check failed:', e.message);
      // CRITICAL: Block SMS if compliance check fails
      console.log(`Blocked SMS to ${callerPhone} - compliance check failure`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    if (!canContact) {
      console.log(`SMS blocked for ${callerPhone}: ${complianceReason}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Only proceed if owner didn't answer (AI fallback) ---
    // At this point, we know the call wasn't answered by the owner
    // So we send AI SMS follow-up

    // For CA/NY: Send opt-in confirmation first instead of business message
    const requiresExplicitConsent = ['CA', 'NY'].includes(callerState);

    if (requiresExplicitConsent && !consent.explicit_sms_consent) {
      // Send opt-in confirmation request FIRST
      const fromPhone = toPhone;
      const client = twilio(accountSid, authToken);

      const optInMessage = `Hi! This is ${profile.business_name}. Reply YES to receive SMS updates about your service request, or STOP if you prefer not to receive messages.`;

      await client.messages.create({
        body: optInMessage,
        from: fromPhone,
        to: callerPhone,
      });

      console.log(`CA/NY opt-in confirmation sent to ${callerPhone}`);
      // CRITICAL: MUST return here - do not send business message without explicit consent
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
      const users = await base44.asServiceRole.entities.User.filter({ email: profile.created_by });
      const profileOwner = users[0];

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
                <a href="${Deno.env.get('APP_BASE_URL') || 'https://catchacaller.com'}/conversations" style="color: #3b82f6;">View conversation →</a>
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