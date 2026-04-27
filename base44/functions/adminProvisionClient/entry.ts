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
    const resolvedPlan = plan_name === 'Trial' ? 'Starter' : (plan_name || 'Starter');

    // 1. Invite user
    try {
      await base44.users.inviteUser(email, 'user');
await base44.users.sendPasswordResetEmail(email);
    } catch (inviteErr) {
      return Response.json({ error: 'inviteUser failed: ' + inviteErr.message, step: 'invite' }, { status: 500 });
    }

    // 2. Create BusinessProfile
    try {
      await base44.asServiceRole.entities.BusinessProfile.create({
        owner_email: email,
        business_name,
        industry: industry || 'hvac',
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
      });
    } catch (profileErr) {
      return Response.json({ error: 'BusinessProfile.create failed: ' + profileErr.message, step: 'profile' }, { status: 500 });
    }

    // 3. Create trial subscription
    try {
      await base44.asServiceRole.entities.Subscription.create({
        user_email: email,
        stripe_subscription_id: `admin_provisioned_${Date.now()}`,
        status: 'trial',
        plan_name: resolvedPlan,
        trial_end_date: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      });
    } catch (subErr) {
      return Response.json({ error: 'Subscription.create failed: ' + subErr.message, step: 'subscription' }, { status: 500 });
    }

    // 4. Log audit entry
    try {
      await base44.asServiceRole.entities.AdminAuditLog.create({
        admin_email: user.email,
        action: 'account_approved',
        target_email: email,
        target_business: business_name,
        reason: `Admin-provisioned. Plan: ${resolvedPlan}, Trial: ${trialDaysNum} days`,
      });
    } catch (auditErr) {
      // Non-fatal — don't fail the whole request over audit log
      console.warn('AdminAuditLog.create failed:', auditErr.message);
    }

    return Response.json({ success: true, plan: resolvedPlan, trial_days: trialDaysNum });
  } catch (error) {
    console.error('adminProvisionClient error:', error.message, error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});
