import twilio from 'npm:twilio';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Template for CA/NY: Sends explicit SMS opt-in confirmation from business number
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone_number, business_name, business_phone } = await req.json();

    if (!phone_number || !business_name || !business_phone) {
      return Response.json(
        { error: 'phone_number, business_name, and business_phone required' },
        { status: 400 }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const client = twilio(accountSid, authToken);

    const message = `Hi! This is ${business_name}. Reply YES to receive SMS updates about your service request, or STOP if you prefer not to receive messages.`;

    await client.messages.create({
      body: message,
      from: business_phone,
      to: phone_number,
    });

    return Response.json({
      success: true,
      sent_to: phone_number,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});