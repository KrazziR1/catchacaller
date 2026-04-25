import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const signature = req.headers.get('x-twilio-signature');
    const url = new URL(req.url);

    if (!signature || !authToken) {
      return Response.json({ error: 'Missing signature or token' }, { status: 403 });
    }

    // Parse body for validation
    const body = await req.text();
    
    // Import Twilio to validate signature
    const twilio = await import('npm:twilio').then(m => m.default);
    
    // Validate signature
    const isValid = twilio.validateRequest(authToken, signature, url.toString(), body);

    if (!isValid) {
      console.warn('Invalid Twilio webhook signature detected');
      return Response.json({ valid: false }, { status: 403 });
    }

    // Log successful webhook for audit
    if (user) {
      try {
        await base44.asServiceRole.entities.AdminAuditLog.create({
          admin_email: 'system@twilio',
          action: 'account_approved', // Placeholder action
          target_email: user.email,
          target_business: 'Webhook validation passed',
          reason: 'Incoming Twilio webhook signature validated',
        });
      } catch (e) {
        console.warn('Audit logging failed:', e.message);
      }
    }

    return Response.json({ valid: true });
  } catch (error) {
    console.error('Webhook validation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});