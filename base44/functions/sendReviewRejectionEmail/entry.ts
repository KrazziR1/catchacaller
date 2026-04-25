import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email, business_name, reason } = await req.json();

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const subject = 'CatchACaller Account Review – Action Required';
    const body = `Hi,

Thank you for signing up for CatchACaller. After reviewing your account, we're unable to activate your service at this time.

Reason: ${reason || 'Your industry or use case does not meet our current compliance requirements.'}

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