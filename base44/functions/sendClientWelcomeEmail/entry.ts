import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, business_name, plan_name, trial_days } = await req.json();
    if (!email || !business_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const trialDaysNum = parseInt(trial_days) || 7;
    const resolvedPlan = plan_name === 'Trial' ? 'Starter' : (plan_name || 'Starter');
    const planLabel = plan_name === 'Trial'
      ? `${trialDaysNum}-Day Free Trial`
      : `${resolvedPlan} (${trialDaysNum}-day trial)`;

    const setupUrl = `https://catchacaller.com/setup?email=${encodeURIComponent(email)}`;

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:40px 32px;text-align:center;">
    <div style="font-size:40px;margin-bottom:12px;">📞</div>
    <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">Welcome to CatchACaller!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:15px;">${business_name} is ready to capture missed calls</p>
  </div>

  <!-- Body -->
  <div style="padding:36px 32px;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px 0;">Hi there,</p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
      Your CatchACaller account has been created and your dashboard is fully pre-configured.
      Click the button below to set your password and access your dashboard — takes less than a minute.
    </p>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 28px 0;">
      <em>Note: You may also receive a separate email titled "You're invited to join CatchACaller" — you can ignore that one.</em>
    </p>

    <!-- Single CTA -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${setupUrl}" style="display:inline-block;background:#3b82f6;color:white;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;">
        Set Up My Account →
      </a>
      <p style="margin:12px 0 0 0;color:#94a3b8;font-size:12px;">
        Button not working? Copy this link: ${setupUrl}
      </p>
    </div>

    <!-- What's waiting -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#15803d;">✅ Already set up for you:</p>
      <ul style="margin:0;padding-left:18px;color:#166534;font-size:13px;line-height:1.9;">
        <li>Your business profile is configured</li>
        <li>AI call answering is ready to activate</li>
        <li>SMS templates are pre-loaded</li>
        <li>${trialDaysNum}-day free trial — no credit card needed</li>
      </ul>
    </div>

    <!-- Account summary -->
    <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;font-size:13px;">
      <strong style="color:#475569;">Your account summary:</strong>
      <div style="margin-top:8px;color:#64748b;line-height:1.9;">
        <div>📧 Login email: <strong style="color:#1e293b;">${email}</strong></div>
        <div>🏢 Business: <strong style="color:#1e293b;">${business_name}</strong></div>
        <div>📋 Plan: <strong style="color:#1e293b;">${planLabel}</strong></div>
      </div>
    </div>

    <p style="color:#94a3b8;font-size:13px;margin:0;">Questions? Email us at <a href="mailto:contact@catchacaller.com" style="color:#3b82f6;">contact@catchacaller.com</a></p>
    <p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">— The CatchACaller Team</p>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;padding:14px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 CatchACaller · <a href="https://catchacaller.com/privacy" style="color:#94a3b8;">Privacy</a></p>
  </div>

</div>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CatchACaller <contact@updates.catchacaller.com>',
        to: [email],
        subject: `Your CatchACaller account is ready — ${business_name}`,
        html,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      return Response.json({
        error: resendData.message || 'Email send failed',
        needs_domain_verification: resendData.message?.includes('domain') || false,
      }, { status: 500 });
    }

    return Response.json({ success: true, id: resendData.id });
  } catch (error) {
    console.error('sendClientWelcomeEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});