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
      Your CatchACaller account has been set up on the <strong>${planLabel}</strong>. 
      You're one step away from accessing your dashboard — no credit card needed until your trial ends.
    </p>

    <!-- Single CTA box -->
    <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:14px;padding:28px 24px;margin-bottom:28px;text-align:center;">
      <div style="font-size:32px;margin-bottom:12px;">📬</div>
      <p style="margin:0 0 8px 0;font-size:17px;font-weight:800;color:#1e3a8a;">Check your inbox right now</p>
      <p style="margin:0 0 20px 0;color:#1d4ed8;font-size:14px;line-height:1.6;">
        You received a separate email from <strong>no-reply@catchacaller.com</strong><br/>
        with the subject: <strong>"You're invited to join CatchACaller"</strong>
      </p>
      <p style="margin:0 0 20px 0;color:#475569;font-size:13px;">
        Click the <strong>"Access app"</strong> button in that email to set your password and log in to your dashboard.
      </p>
      <div style="background:#dbeafe;border-radius:8px;padding:10px 16px;display:inline-block;">
        <p style="margin:0;font-size:12px;color:#1e40af;">
          📌 Your login email: <strong>${email}</strong>
        </p>
      </div>
    </div>

    <!-- Can't find it? -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#475569;">Can't find the invite email?</p>
      <ul style="margin:0;padding-left:18px;color:#64748b;font-size:13px;line-height:1.9;">
        <li>Check your <strong>spam or junk folder</strong></li>
        <li>Search for <strong>no-reply@catchacaller.com</strong></li>
        <li>Still can't find it? Reply to this email and we'll resend it</li>
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
      console.error('Resend error:', JSON.stringify(resendData));
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