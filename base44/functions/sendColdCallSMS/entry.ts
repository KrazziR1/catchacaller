import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { prospect_id, phone_number, message_body } = await req.json();

    if (!prospect_id || !phone_number || !message_body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate phone format
    if (!/^\+1\d{10}$/.test(phone_number)) {
      return Response.json({ error: 'Invalid phone format' }, { status: 400 });
    }

    // Block test numbers (555)
    if (/^\+1555/.test(phone_number)) {
      return Response.json({ error: 'Cannot send to test numbers (555)' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromPhone) {
      console.error('Missing Twilio config');
      return Response.json({ error: 'Configuration error' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    // Send SMS
    const msg = await client.messages.create({
      body: message_body,
      from: fromPhone,
      to: phone_number,
    });

    // Log to ColdCallSMSLog
    await base44.asServiceRole.entities.ColdCallSMSLog.create({
      prospect_id,
      phone_number,
      message_body,
      direction: 'outbound',
      status: 'sent',
      twilio_message_sid: msg.sid,
      sent_at: new Date().toISOString(),
      sent_by: user.email,
    });

    return Response.json({ success: true, message_sid: msg.sid });
  } catch (error) {
    console.error('sendColdCallSMS error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});