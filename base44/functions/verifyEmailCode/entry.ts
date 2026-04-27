import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — verifies email code for newly registered users v1
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
console.log('body received:', JSON.stringify(body));
const { code } = body;

    if (!code) {
      return Response.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    await base44.asServiceRole.auth.verifyEmail(code);
    return Response.json({ success: true });

  } catch (error) {
    console.error('verifyEmailCode error:', error.message);
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('invalid') || msg.includes('expired') || msg.includes('not found')) {
      return Response.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
