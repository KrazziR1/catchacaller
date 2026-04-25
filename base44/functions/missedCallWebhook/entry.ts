import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

async function parseFormBody(req) {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

Deno.serve(async (req) => {
  try {
    const body = await parseFormBody(req);
    const { CallStatus, From, To, CallerName, CallSid } = body;

    console.log(`Call event: ${CallStatus} from ${From}`);

    // Only process missed/unanswered calls
    const missedStatuses = ['no-answer', 'busy', 'failed'];
    if (!missedStatuses.includes(CallStatus)) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const callerPhone = From;
    const base44 = createClientFromRequest(req);

    // --- Check opt-out ---
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
    if (optOuts.length > 0) {
      console.log(`Skipping ${callerPhone} — opted out`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Load business profile ---
    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];

    if (!profile || !profile.auto_response_enabled) {
      console.log('No profile or auto-response disabled');
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    const now = new Date();
    const callTime = now.toISOString();
    const startTime = Date.now();

    // --- Create MissedCall record ---
    const missedCall = await base44.asServiceRole.entities.MissedCall.create({
      caller_phone: callerPhone,
      caller_name: CallerName || null,
      call_time: callTime,
      status: 'new',
      estimated_value: profile.average_job_value || 500,
    });

    // --- Build initial SMS message ---
    const name = profile.business_name;
    const personality = profile.ai_personality || 'friendly';
    const bookingLine = profile.booking_url ? ` Book here: ${profile.booking_url}` : '';

    const smsBody = personality === 'professional'
      ? `Hi, this is ${name}. We missed your call and want to make sure we help you. What can we assist you with today?${bookingLine} Reply STOP to opt out.`
      : `Hi! 👋 Sorry we missed your call — we're ${name}. We'd love to help! What can we do for you?${bookingLine} Reply STOP to opt out.`;

    // --- Send SMS ---
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER') || To;
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: smsBody,
      from: fromPhone,
      to: callerPhone,
    });

    const responseTimeMs = Date.now() - startTime;

    // --- Update MissedCall record ---
    await base44.asServiceRole.entities.MissedCall.update(missedCall.id, {
      status: 'sms_sent',
      sms_sent_at: new Date().toISOString(),
      response_time_seconds: Math.round(responseTimeMs / 1000),
    });

    // --- Create Conversation record ---
    await base44.asServiceRole.entities.Conversation.create({
      missed_call_id: missedCall.id,
      caller_phone: callerPhone,
      caller_name: CallerName || null,
      status: 'active',
      messages: [{
        sender: 'ai',
        content: smsBody,
        timestamp: new Date().toISOString(),
        sms_status: 'sent',
      }],
      last_message_at: new Date().toISOString(),
    });

    // --- Send email notification to business owner (async, best effort) ---
    try {
      // Get the first admin user to notify
      const users = await base44.asServiceRole.entities.User.list('-created_date', 1);
      if (users[0]) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: users[0].email,
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
                <a href="https://app.catchacaller.com/conversations" style="color: #3b82f6;">View conversation →</a>
              </p>
            </div>
          `,
          from_name: 'CatchACaller',
        });
      }
    } catch (emailErr) {
      console.error('Email notification failed (non-critical):', emailErr.message);
    }

    console.log(`✓ Missed call processed for ${callerPhone}, SMS sent in ${responseTimeMs}ms`);

    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('missedCallWebhook error:', error);
    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  }
});