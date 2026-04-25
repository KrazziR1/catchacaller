import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify active subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_email: user.email
    });
    const sub = subs[0];
    if (!sub || !['active', 'trialing'].includes(sub.status)) {
      return Response.json({ error: 'Subscription required for exports' }, { status: 403 });
    }

    // Fetch all conversations and missed calls for this user
    const conversations = await base44.entities.Conversation.filter(
      { created_by: user.email },
      '-created_date',
      1000
    );

    const missedCalls = await base44.entities.MissedCall.list('-call_time', 1000);

    // Build CSV
    const headers = ['Date', 'Caller Phone', 'Status', 'Messages', 'Booked', 'Est. Value', 'Notes'];
    const rows = conversations.map(c => [
      new Date(c.created_date).toLocaleDateString(),
      c.caller_phone || '',
      c.status || '',
      c.messages?.length || 0,
      c.status === 'booked' ? 'Yes' : 'No',
      c.estimated_value || 0,
      c.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=conversations.csv'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});