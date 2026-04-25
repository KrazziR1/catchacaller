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

    // Issue refund if requested
    if (issueRefund) {
      try {
        const stripe = await import('npm:stripe');
        const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));
        
        // Find customer by email
        const customers = await stripeClient.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          // Find the charge for provisioning ($2.99 = 299 cents)
          const charges = await stripeClient.charges.list({ customer: customerId, limit: 10 });
          const provisioningCharge = charges.data.find(c => c.amount === 299 && c.description?.includes('provision'));
          
          if (provisioningCharge) {
            await stripeClient.refunds.create({ charge: provisioningCharge.id });
          }
        }
      } catch (refundErr) {
        console.warn('Refund processing failed (non-critical):', refundErr.message);
      }
    }

    const subject = 'CatchACaller Account Review – Action Required';
    const refundLine = issueRefund ? '\n\nWe have issued a refund of $2.99 for your provisioning fee, which should appear in your account within 3-5 business days.' : '';
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