import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { code, email } = await req.json();

    console.log('email received:', JSON.stringify(email));
    console.log('code received:', JSON.stringify(code));
    console.log('email type:', typeof email);
    console.log('code type:', typeof code);

    if (!code || !email) {
      return Response.json({ error: 'Code and email are required.' }, { status: 400 });
    }

    await base44.auth.verifyOtp({ email: email.trim().toLowerCase(), otpCode: code.trim() });
    return Response.json({ success: true });

  } catch (error) {
    console.error('verifyEmailCode error:', error.message);
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('invalid') || msg.includes('expired')) {
      return Response.json({ error: 'Invalid or expired code. Please try again.' }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});