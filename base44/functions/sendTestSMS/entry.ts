import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to_phone, business_name, ai_personality } = await req.json();

    if (!to_phone) return Response.json({ error: 'Missing to_phone' }, { status: 400 });

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    const name = business_name || 'your business';
    const tone = ai_personality === 'professional'
      ? `Thank you for contacting ${name}. We missed your call and would be happy to assist you. What can we help you with today?`
      : `Hi! 👋 Sorry we missed your call — we're ${name}. What can we help you with today?`;

    const body = `[TEST] ${tone}`;

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
        body: new URLSearchParams({ From: fromNumber, To: to_phone, Body: body }),
      }
    );

    const data = await res.json();
    if (data.error_code) {
      return Response.json({ success: false, error: data.message }, { status: 400 });
    }

    return Response.json({ success: true, message: body });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});