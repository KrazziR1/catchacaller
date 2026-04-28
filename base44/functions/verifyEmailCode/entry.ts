import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const code = payload?.code;

    // Log what actually exists on asServiceRole
    console.log('asServiceRole keys:', JSON.stringify(Object.keys(base44.asServiceRole || {})));
    console.log('asServiceRole.auth:', JSON.stringify(typeof base44.asServiceRole?.auth));
    console.log('code:', code);

    return Response.json({ 
      asServiceRole_keys: Object.keys(base44.asServiceRole || {}),
      asServiceRole_auth: typeof base44.asServiceRole?.auth,
      code_received: code 
    });
  } catch (error) {
    console.error('error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});