import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { conversation_id } = payload;

    // Call the same sync function
    const result = await base44.functions.invoke('syncToCRM', {
      conversation_id,
    });

    return Response.json(result);
  } catch (error) {
    console.error('Manual sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});