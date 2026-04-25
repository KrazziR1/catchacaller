import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const signature = req.headers.get('x-twilio-signature');
    const url = new URL(req.url);

    if (!signature || !authToken) {
      return Response.json({ error: 'Invalid webhook' }, { status: 403 });
    }

    // Parse body for validation
    const body = await req.text();
    
    // Import Twilio to validate signature
    const twilio = await import('npm:twilio').then(m => m.default);
    
    // Validate signature
    const isValid = twilio.validateRequest(authToken, signature, url.toString(), body);

    return Response.json({ valid: isValid });
  } catch (error) {
    console.error('Webhook validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});