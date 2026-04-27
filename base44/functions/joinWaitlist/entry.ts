import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no auth required. Saves a waitlist entry and sends confirmation email.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, business_name, phone, industry, monthly_calls, source } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Check for duplicate using service role (bypasses RLS)
    const existing = await base44.asServiceRole.entities.WaitlistEntry.filter({ email });
    if (existing.length > 0) {
      return Response.json({ already_exists: true });
    }

    // Save entry using service role
    await base44.asServiceRole.entities.WaitlistEntry.create({
      email,
      business_name: business_name || null,
      phone: phone || null,
      industry: industry || null,
      monthly_calls: monthly_calls || null,
      source: source || null,
    });

    // Note: SendEmail cannot reach non-app-users (platform restriction).
    // The waitlist entry is saved — admin will follow up manually or via a future email integration.

    return Response.json({ success: true });
  } catch (error) {
    console.error('joinWaitlist error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});