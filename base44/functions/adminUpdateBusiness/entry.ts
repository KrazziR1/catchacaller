import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { businessId, updates, auditAction, auditTarget, auditBusiness, auditReason } = await req.json();

    if (!businessId || !updates) {
      return Response.json({ error: 'businessId and updates are required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.BusinessProfile.update(businessId, updates);

    if (auditAction) {
      try {
        await base44.asServiceRole.entities.AdminAuditLog.create({
          admin_email: user.email,
          action: auditAction,
          target_email: auditTarget || '',
          target_business: auditBusiness || '',
          reason: auditReason || '',
        });
      } catch (e) {
        console.warn('Audit log failed (non-critical):', e.message);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('adminUpdateBusiness error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
