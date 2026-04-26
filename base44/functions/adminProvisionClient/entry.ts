import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Must be admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      email, business_name, industry, industry_description,
      phone_number, owner_phone_number, booking_url, website,
      facebook_url, instagram_url, google_business_url,
      business_hours, ai_personality, timezone, plan_name, trial_days,
    } = await req.json();

    if (!email || !business_name) {
      return Response.json({ error: 'Email and business name are required.' }, { status: 400 });
    }

    const trialDaysNum = parseInt(trial_days) || 7;
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + trialDaysNum);

    // 1. Invite user (Base44 sends them a password-setup email)
    await base44.users.inviteUser(email, 'user');

    // 2. Create BusinessProfile
    await base44.asServiceRole.entities.BusinessProfile.create({
      business_name,
      industry,
      industry_description: industry === 'other' ? (industry_description || null) : null,
      phone_number: phone_number || null,
      owner_phone_number: owner_phone_number || null,
      booking_url: booking_url || null,
      website: website || null,
      facebook_url: facebook_url || null,
      instagram_url: instagram_url || null,
      google_business_url: google_business_url || null,
      business_hours: business_hours || 'Mon-Fri 8am-6pm',
      ai_personality: ai_personality || 'friendly',
      timezone: timezone || 'America/New_York',
      auto_response_enabled: true,
      email_notifications_enabled: true,
      terms_accepted_at: new Date().toISOString(),
      terms_version: '2026-04-25',
      consent_acknowledged_at: new Date().toISOString(),
      requires_manual_review: false,
      is_high_risk_industry: false,
      created_by: email,
    });

    // 3. Create trial subscription
    const resolvedPlan = plan_name === 'Trial' ? 'Starter' : plan_name;
    await base44.asServiceRole.entities.Subscription.create({
      user_email: email,
      stripe_subscription_id: `admin_provisioned_${Date.now()}`,
      status: 'trial',
      plan_name: resolvedPlan,
      trial_end_date: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString(),
    });

    // 4. Send branded welcome email
    const planLabel = plan_name === 'Trial'
      ? `${trialDaysNum}-Day Free Trial`
      : `${resolvedPlan} (${trialDaysNum}-day trial)`;

    await base44.integrations.Core.SendEmail({
      to: email,
      from_name: 'CatchACaller',
      subject: `Your CatchACaller account is ready — ${business_name}`,
      body: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:40px 32px;text-align:center;">
    <div style="font-size:40px;margin-bottom:12px;">📞</div>
    <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">Welcome to CatchACaller!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:15px;">${business_name} is ready to capture missed calls</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 20px 0;">Hi there,</p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
      Your CatchACaller account has been set up on the <strong>${planLabel}</strong>. Follow the steps below to access your dashboard — no credit card needed until your trial ends.
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;color:#1d4ed8;">⚡ Two emails, two steps:</p>
      <div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start;">
        <div style="background:#3b82f6;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;line-height:28px;text-align:center;">1</div>
        <div>
          <p style="margin:0 0 4px 0;font-weight:600;color:#1e3a8a;font-size:14px;">Check your inbox for a separate "You've been invited" email</p>
          <p style="margin:0;color:#3b82f6;font-size:13px;">Click <strong>"Access app"</strong> in that email to set your password. Your login email is: <strong>${email}</strong></p>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div style="background:#3b82f6;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;line-height:28px;text-align:center;">2</div>
        <div>
          <p style="margin:0 0 4px 0;font-weight:600;color:#1e3a8a;font-size:14px;">Once logged in, go straight to your dashboard</p>
          <p style="margin:0;color:#3b82f6;font-size:13px;">Everything is pre-configured and ready to go.</p>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="https://catchacaller.com/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Go to My Dashboard →</a>
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:20px;font-size:13px;">
      <strong style="color:#475569;">Your account details:</strong>
      <div style="margin-top:8px;color:#64748b;">
        <div>📧 Login email: <strong style="color:#1e293b;">${email}</strong></div>
        <div style="margin-top:4px;">🏢 Business: <strong style="color:#1e293b;">${business_name}</strong></div>
        <div style="margin-top:4px;">📋 Plan: <strong style="color:#1e293b;">${planLabel}</strong></div>
        ${phone_number ? `<div style="margin-top:4px;">📞 Business phone: <strong style="color:#1e293b;">${phone_number}</strong></div>` : ''}
      </div>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;">Questions? Email us at <a href="mailto:contact@catchacaller.com" style="color:#3b82f6;">contact@catchacaller.com</a> — we respond personally.</p>
    <p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">— The CatchACaller Team</p>
  </div>
  <div style="background:#f8fafc;padding:14px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 CatchACaller · <a href="https://catchacaller.com/privacy" style="color:#94a3b8;">Privacy</a></p>
  </div>
</div>`,
    });

    // 5. Log audit entry
    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_email: user.email,
      action: 'account_approved',
      target_email: email,
      target_business: business_name,
      reason: `Admin-provisioned. Plan: ${resolvedPlan}, Trial: ${trialDaysNum} days`,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('adminProvisionClient error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});