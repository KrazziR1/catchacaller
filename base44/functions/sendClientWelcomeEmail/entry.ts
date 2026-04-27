import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Sends a branded welcome email via Resend API.
// IMPORTANT: Requires catchacaller.com to be verified at resend.com/domains
// Until then, emails will only succeed if the recipient is the Resend account owner.
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

    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:40px 32px;text-align:center;">
    <div style="font-size:40px;margin-bottom:12px;">📞</div>
    <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">Welcome to CatchACaller!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:15px;">${business_name} is ready to capture missed calls</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 20px 0;">Hi there,</p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
      Your CatchACaller account has been set up on the <strong>${planLabel}</strong>. Follow the steps below to get in — no credit card needed until your trial ends.
    </p>
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#713f12;">
        <strong>📬 Note:</strong> You also received a separate email with the subject "You've been invited to join CatchACaller." Click <strong>Access app</strong> in that email to set your password and log in.
      </p>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;color:#1d4ed8;">⚡ Getting started — 2 steps:</p>
      <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
        <div style="background:#3b82f6;color:white;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;line-height:28px;text-align:center;">1</div>
        <div>
          <p style="margin:0 0 4px 0;font-weight:600;color:#1e3a8a;font-size:14px;">Check your inbox for the invite email</p>
          <p style="margin:0;color:#1d4ed8;font-size:13px;">Click <strong>"Access app"</strong> to set your password.</p>
          <p style="margin:6px 0 0 0;color:#64748b;font-size:12px;">📌 Your login email: <strong style="color:#1e293b;">${email}</strong></p>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div style="background:#3b82f6;color:white;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;line-height:28px;text-align:center;">2</div>
        <div>
          <p style="margin:0 0 4px 0;font-weight:600;color:#1e3a8a;font-size:14px;">Sign in and go to your dashboard</p>
          <p style="margin:0;color:#1d4ed8;font-size:13px;">Everything is pre-configured and ready to go.</p>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="https://catchacaller.com/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Go to My Dashboard →</a>
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:20px;font-size:13px;">
      <strong style="color:#475569;">Your account summary:</strong>
      <div style="margin-top:8px;color:#64748b;line-height:1.8;">
        <div>📧 Login email: <strong style="color:#1e293b;">${email}</strong></div>
        <div>🏢 Business: <strong style="color:#1e293b;">${business_name}</strong></div>
        <div>📋 Plan: <strong style="color:#1e293b;">${planLabel}</strong></div>
      </div>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;">Questions? Email us at <a href="mailto:contact@catchacaller.com" style="color:#3b82f6;">contact@catchacaller.com</a></p>
    <p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">— The CatchACaller Team</p>
  </div>
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
      console.error('Resend error:', JSON.stringify(resendData));
      // Return a specific flag so the frontend can show a domain verification warning
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