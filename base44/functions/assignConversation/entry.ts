import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const { conversation_id, assigned_to } = payload;

    // Validate conversation_id
    if (!conversation_id || typeof conversation_id !== 'string') {
      return Response.json({ error: 'Invalid conversation_id' }, { status: 400 });
    }

    // Validate assigned_to if provided
    if (assigned_to && typeof assigned_to !== 'string') {
      return Response.json({ error: 'Invalid assigned_to email' }, { status: 400 });
    }

    // Verify user owns this conversation's profile
    const conv = await base44.entities.Conversation.get(conversation_id);
    if (!conv) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const profile = await base44.entities.BusinessProfile.filter({ created_by: user.email });
    if (profile.length === 0) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // If assigning to a team member, verify they belong to this business
    if (assigned_to) {
      const teamMember = await base44.entities.TeamMember.filter({ 
        user_email: assigned_to,
        account_id: profile[0].id
      });
      if (teamMember.length === 0) {
        return Response.json({ error: 'Team member not found' }, { status: 404 });
      }
    }

    // Update conversation assignment
    const updated = await base44.entities.Conversation.update(conversation_id, {
      assigned_to: assigned_to || null,
    });

    console.info(`Conversation ${conversation_id} assigned to ${assigned_to || 'unassigned'} by ${user.email}`);
    return Response.json({ success: true, conversation: updated });
  } catch (error) {
    console.error(`assignConversation error for ${user?.email}:`, error.message);
    return Response.json({ error: 'Failed to assign conversation' }, { status: 500 });
  }
});