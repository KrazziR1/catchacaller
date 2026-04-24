import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await base44.entities.Conversation.list('-created_date', 1000);

    // Build CSV
    const headers = ['Caller Name', 'Caller Phone', 'Status', 'Pipeline Stage', 'Service Type', 'Urgency', 'Messages', 'Created Date', 'Last Message'];
    const rows = conversations.map(c => [
      c.caller_name || '',
      c.caller_phone,
      c.status,
      c.pipeline_stage || '',
      c.service_type || '',
      c.urgency || '',
      (c.messages || []).length,
      new Date(c.created_date).toLocaleDateString(),
      c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : '',
    ]);

    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(',')),
    ].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=conversations.csv',
      },
    });
  } catch (error) {
    console.error('exportConversations error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});