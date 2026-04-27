import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no auth required. Saves a waitlist entry and sends confirmation email via Resend. V2
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

    // Send confirmation email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      try {
        const html = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:36px;margin-bottom:10px;">📞</div>
              <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">You're on the list!</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:14px;">CatchACaller Early Access</p>
            </div>
            <div style="padding:32px;">
              <p style="font-size:15px;color:#1e293b;margin:0 0 16px 0;">Hi ${business_name || 'there'},</p>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                Thanks for joining the CatchACaller waitlist. We're in private onboarding right now and our team will personally reach out when your spot is ready.
              </p>
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
                <p style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#1d4ed8;">What happens next:</p>
                <ul style="margin:0;padding-left:18px;color:#1d4ed8;font-size:13px;line-height:1.9;">
                  <li>Our team reviews your spot (usually within 24–48hrs)</li>
                  <li>We'll email you directly to get you onboarded</li>
                  <li>Your AI call answering goes live — no tech setup needed</li>
                </ul>
              </div>
              <p style="color:#94a3b8;font-size:13px;margin:0;">Questions? Email us at <a href="mailto:contact@catchacaller.com" style="color:#3b82f6;">contact@catchacaller.com</a></p>
              <p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">— The CatchACaller Team</p>
            </div>
            <div style="background:#f8fafc;padding:12px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 CatchACaller · <a href="https://catchacaller.com/privacy" style="color:#94a3b8;">Privacy</a></p>
            </div>
          </div>
        `;

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
            html,
          }),
        });
      } catch (emailErr) {
        // Non-fatal — entry is already saved
        console.warn('Waitlist confirmation email failed:', emailErr.message);
      }
    } else {
      console.warn('RESEND_API_KEY not set — skipping confirmation email');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('joinWaitlist error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
