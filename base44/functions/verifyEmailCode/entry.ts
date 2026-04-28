import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Note: user may not be authenticated yet (email verification flow)
    // so we don't check auth here
    
    const payload = await req.json();
    console.log('payload:', JSON.stringify(payload));
    const code = payload?.code;

    if (!code) {
      return Response.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    await base44.asServiceRole.auth.verifyEmail(code);
    return Response.json({ success: true });

  } catch (error) {
    console.error('verifyEmailCode error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});