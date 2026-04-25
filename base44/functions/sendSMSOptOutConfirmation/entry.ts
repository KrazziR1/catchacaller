import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { phone_number, business_phone } = body;

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER') || business_phone;

    const client = await import('npm:twilio').then(m => m.default(accountSid, authToken));

    await client.messages.create({
      body: `You have been unsubscribed from SMS messages. You will no longer receive communications from this number.`,
      from: fromPhone,
      to: phone_number
    });

    return Response.json({ success: true, message: 'Opt-out confirmation sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});