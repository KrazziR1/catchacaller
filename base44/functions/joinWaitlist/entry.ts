import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no auth required. Saves a waitlist entry and sends confirmation email via Resend.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, business_name, phone, industry, monthly_calls, source } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.WaitlistEntry.filter({ email });
    if (existing.length > 0) {
      return Response.json({ already_exists: true });
    }

    await base44.asServiceRole.entities.WaitlistEntry.create({
      email,
      business_name: business_name || null,
      phone: phone || null,
      industry: industry || null,
      monthly_calls: monthly_calls || null,
      source: source || null,
    });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'CatchACaller <contact@catchacaller.com>',
            to: [email],
            subject: "You're on the CatchACaller waitlist 🎉",
            html: `<p>Hi ${business_name || 'there'}, thanks for joining the CatchACaller waitlist! We'll reach out personally when your spot is ready.</p>`,
          }),
        });
      } catch (emailErr) {
        console.warn('Waitlist confirmation email failed:', emailErr.message);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('joinWaitlist error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});