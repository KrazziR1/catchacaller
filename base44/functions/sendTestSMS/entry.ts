import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to_phone, business_name, ai_personality } = await req.json();

    if (!to_phone) return Response.json({ error: 'to_phone is required' }, { status: 400 });

    // Normalize phone number
    const normalized = to_phone.replace(/\D/g, '');
    // Support international: handle country codes
    let e164 = normalized.startsWith('1') ? `+${normalized}` : `+1${normalized}`;
    if (normalized.length === 10) e164 = `+1${normalized}`; // US 10-digit
    if (normalized.length === 11 && normalized.startsWith('1')) e164 = `+${normalized}`; // US with +1

    // Get user's profile
    const userProfiles = await base44.asServiceRole.entities.BusinessProfile.filter({ created_by: user.email });
    if (userProfiles.length === 0) {
      return Response.json({ success: false, error: 'No business profile found. Complete onboarding first.' });
    }

    // Check opt-out list (respect previous opt-outs even for tests)
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.list('-created_date', 1000);
    const isOptedOut = optOuts.some(o => o.phone_number === e164);
    if (isOptedOut) {
      return Response.json({ success: false, error: 'This number has opted out of SMS.' });
    }

    // WARN: Test SMS should only go to user's own number or similar verification
    // For now: log all test SMSes for audit and limit frequency per user to prevent abuse
    const recentTests = await base44.entities.SMSAuditLog.filter({
      sent_by: user.email,
      message_type: 'test'
    });
    const lastTestTime = recentTests[0]?.sent_at ? new Date(recentTests[0].sent_at) : null;
    const now = new Date();
    if (lastTestTime && (now - lastTestTime) < 30000) {
      return Response.json({ success: false, error: 'Please wait 30 seconds before sending another test SMS.' });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    const client = twilio(accountSid, authToken);

    const name = business_name || 'your business';
    const body = ai_personality === 'professional'
      ? `Thank you for contacting ${name}. We missed your call and would be happy to assist you. What can we help you with today? Reply STOP to opt out.`
      : `Hi! 👋 Sorry we missed your call — we're ${name}. What can we help you with today? Reply STOP to opt out.`;

    const msg = await client.messages.create({ body, from: fromPhone, to: e164 });

    // Log to audit trail
    try {
      await base44.functions.invoke('logSMSAudit', {
        phone_number: e164,
        business_phone: fromPhone,
        message_body: body,
        message_type: 'test',
        status: 'sent',
        twilio_message_sid: msg.sid,
        consent_type: 'test',
      });
    } catch (auditError) {
      console.warn('Audit logging failed (non-critical):', auditError);
    }

    return Response.json({ success: true, sent_to: e164 });
  } catch (error) {
    console.error('sendTestSMS error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});