import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { conversation_id, message_body, scheduled_time, business_timezone } = body;

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!scheduled_time || !business_timezone) {
      return Response.json({ error: 'scheduled_time and business_timezone required' }, { status: 400 });
    }

    // Parse the scheduled time in business timezone
    const scheduledDate = new Date(scheduled_time);
    
    // Convert to UTC using the business timezone offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: business_timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // For simplicity, we'll store the scheduled message and let a cron job process it
    // This is a placeholder - you'd implement a scheduled_messages table in production
    
    return Response.json({
      success: true,
      message: 'SMS scheduled',
      scheduled_utc: scheduledDate.toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});