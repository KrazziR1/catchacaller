import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email, business_name, reason, issueRefund } = await req.json();

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    let refundSucceeded = false;

    // Issue refund if requested — use stored charge ID from profile
    if (issueRefund) {
      try {
        // Find the business profile to get the stored charge ID
        const allProfiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 500);
        const profile = allProfiles.find(p => p.created_by === email);

        if (profile?.stripe_provisioning_charge_id) {
          const stripe = await import('npm:stripe');
          const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));
          
          // Refund using the stored charge ID — guaranteed to be the correct charge
          await stripeClient.refunds.create({
            charge: profile.stripe_provisioning_charge_id,
          });
          refundSucceeded = true;
        }
      } catch (refundErr) {
        console.error('Refund processing failed:', refundErr.message);
        // Don't mention refund in email if it failed
      }
    }

    // Log admin action for audit trail
    try {
      await base44.asServiceRole.entities.AdminAuditLog.create({
        admin_email: user.email,
        action: 'account_rejected',
        target_email: email,
        target_business: business_name,
        reason: reason || 'Account does not meet compliance requirements',
        refund_issued: refundSucceeded,
      });
    } catch (auditErr) {
      console.warn('Audit logging failed (non-critical):', auditErr.message);
    }

    const subject = 'CatchACaller Account Review – Action Required';
    const refundLine = refundSucceeded ? '\n\nWe have issued a refund of $2.99 for your provisioning fee, which should appear in your account within 3-5 business days.' : '';
    const body = `Hi,

Thank you for signing up for CatchACaller. After reviewing your account, we're unable to activate your service at this time.

Reason: ${reason || 'Your industry or use case does not meet our current compliance requirements.'}${refundLine}

If you believe this is an error, or would like to discuss your account further, please reach out to our support team at support@catchacaller.com.

Best regards,
The CatchACaller Team`;

    // Send notification email
    await base44.integrations.Core.SendEmail({
      to: email,
      subject,
      body,
      from_name: 'CatchACaller',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendReviewRejectionEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});