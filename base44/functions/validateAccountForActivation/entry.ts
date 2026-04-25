import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// PRE-ACTIVATION CHECK: Verify account is safe to activate
// Called BEFORE subscription is created and SMS sends begin
// Returns: { safe_to_activate: boolean, blockers: [], warnings: [] }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only function
    if (!user || user.role !== 'admin') {
      console.warn(`Unauthorized account validation attempt from ${user?.email}`);
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { business_profile_id } = payload;

    const blockers = [];
    const warnings = [];

    if (!business_profile_id || typeof business_profile_id !== 'string') {
      return Response.json({ error: 'Invalid business_profile_id' }, { status: 400 });
    }

    // Fetch business profile
    const profile = await base44.asServiceRole.entities.BusinessProfile.get(business_profile_id);

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 1. CRITICAL: Terms must be accepted
    if (!profile.terms_accepted_at) {
      blockers.push('Terms of Service not accepted');
    }

    // 2. CRITICAL: High-risk industries require manual review
    if (profile.is_high_risk_industry && !profile.terms_accepted_at) {
      blockers.push('High-risk industry: Explicit terms acceptance required');
    }

    // 3. CRITICAL: Consent acknowledgment (SMS compliance)
    if (!profile.consent_acknowledged_at) {
      blockers.push('SMS compliance terms not acknowledged');
    }

    // 4. WARNING: Phone number not provisioned
    if (!profile.phone_number) {
      warnings.push('Phone number not provisioned — auto-responses will not work');
    }

    // 5. WARNING: Missing AI personality setting
    if (!profile.ai_personality) {
      warnings.push('AI personality not configured — defaulting to friendly');
    }

    // 6. WARNING: No booking URL (conversion optimization)
    if (!profile.booking_url) {
      warnings.push('No booking URL configured — leads will not be able to book directly');
    }

    // 7. Check for previous violations
    const auditLogs = await base44.asServiceRole.entities.AdminAuditLog.filter({
      target_business: profile.business_name,
    }).catch(() => []);

    const rejections = auditLogs.filter(log => log.action === 'account_rejected');
    if (rejections.length > 0) {
      blockers.push(`Account previously rejected ${rejections.length} times`);
    }

    // 8. Verify Stripe provisioning fee was paid (if applicable)
    if (!profile.stripe_provisioning_charge_id) {
      warnings.push('Provisioning fee not verified — may indicate payment issue');
    }

    console.info(`Account validation for ${profile.business_name}: ${blockers.length} blockers, ${warnings.length} warnings`);
    return Response.json({
      safe_to_activate: blockers.length === 0,
      profile_name: profile.business_name,
      industry: profile.industry,
      is_high_risk: profile.is_high_risk_industry,
      blockers,
      warnings,
      next_steps: blockers.length > 0 
        ? 'Address blockers before activation'
        : warnings.length > 0
        ? 'Review warnings and consider completing optional fields'
        : 'Account ready for activation',
    });
  } catch (error) {
    console.error(`Account validation error for admin ${user?.email}:`, error.message);
    return Response.json({
      safe_to_activate: false,
      blockers: ['Validation service error'],
      warnings: [],
    }, { status: 500 });
  }
});