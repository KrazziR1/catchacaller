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
    const e164 = normalized.startsWith('1') ? `+${normalized}` : `+1${normalized}`;

    // Check opt-out list
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.list('-created_date', 1000);
    const isOptedOut = optOuts.some(o => o.phone_number === e164);
    if (isOptedOut) {
      return Response.json({ success: false, error: 'This number has opted out of SMS.' });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    const client = twilio(accountSid, authToken);

    const name = business_name || 'your business';
    const body = ai_personality === 'professional'
      ? `Thank you for contacting ${name}. We missed your call and would be happy to assist you. What can we help you with today? Reply STOP to opt out.`
      : `Hi! 👋 Sorry we missed your call — we're ${name}. What can we help you with today? Reply STOP to opt out.`;

    await client.messages.create({ body, from: fromPhone, to: e164 });

    return Response.json({ success: true, sent_to: e164 });
  } catch (error) {
    console.error('sendTestSMS error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});