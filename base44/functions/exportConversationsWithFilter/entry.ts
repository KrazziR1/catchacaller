import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { startDate, endDate } = body;

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

    // Fetch conversations with optional date filtering
    const allConversations = await base44.entities.Conversation.list('-created_date', 10000);
    
    let conversations = allConversations;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      
      conversations = allConversations.filter(c => {
        const cDate = new Date(c.created_date);
        return cDate >= start && cDate <= end;
      });
    }

    // Build CSV
    const headers = ['Date', 'Caller Phone', 'Name', 'Status', 'Messages', 'Booked', 'Est. Value'];
    const rows = conversations.map(c => [
      new Date(c.created_date).toLocaleDateString(),
      c.caller_phone || '',
      c.caller_name || '',
      c.status || '',
      c.messages?.length || 0,
      c.status === 'booked' ? 'Yes' : 'No',
      c.estimated_value || 0
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=conversations-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});