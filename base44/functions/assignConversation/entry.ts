import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, assigned_to } = await req.json();

    if (!conversation_id) {
      return Response.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    // Update conversation assignment
    const updated = await base44.entities.Conversation.update(conversation_id, {
      assigned_to: assigned_to || null,
    });

    return Response.json({ success: true, conversation: updated });
  } catch (error) {
    console.error('assignConversation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});