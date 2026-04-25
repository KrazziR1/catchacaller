import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const { conversation_id } = payload;

    // Validate conversation_id
    if (!conversation_id || typeof conversation_id !== 'string') {
      return Response.json({ error: 'Invalid conversation_id' }, { status: 400 });
    }

    // Verify user owns this conversation
    const conv = await base44.entities.Conversation.get(conversation_id);
    if (!conv) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check ownership - user must own the business profile that created this conversation
    const profile = await base44.entities.BusinessProfile.filter({ created_by: user.email });
    if (profile.length === 0) {
      return Response.json({ error: 'No business profile found' }, { status: 403 });
    }

    // Call the sync function
    const result = await base44.asServiceRole.functions.invoke('syncToCRM', {
      conversation_id,
    });

    console.info(`Manual CRM sync initiated by ${user.email} for conversation ${conversation_id}`);
    return Response.json(result);
  } catch (error) {
    console.error(`Manual sync error for ${user?.email}:`, error.message);
    return Response.json({ error: 'Failed to sync to CRM' }, { status: 500 });
  }
});