import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { calendarEvent } = await req.json();

    if (!calendarEvent) {
      return Response.json({ error: 'Missing calendar event' }, { status: 400 });
    }

    const { invitee_email, invitee_name, event_type, scheduled_time } = calendarEvent;

    // Create or update conversation
    const existing = await base44.entities.Conversation.filter({ 
      caller_phone: invitee_email,
      status: "active"
    });

    if (existing.length > 0) {
      // Update existing
      await base44.entities.Conversation.update(existing[0].id, {
        status: "booked",
        booking_link_sent: true,
        last_message_at: new Date().toISOString(),
      });
    } else {
      // Create new
      await base44.entities.Conversation.create({
        caller_phone: invitee_email,
        caller_name: invitee_name,
        status: "booked",
        service_type: event_type,
        booking_link_sent: true,
        last_message_at: new Date().toISOString(),
      });
    }

    // Create calendar booking record
    await base44.entities.CalendarBooking.create({
      conversation_id: existing?.[0]?.id || "pending",
      caller_phone: invitee_email,
      caller_name: invitee_name,
      scheduled_time: scheduled_time,
      service_type: event_type,
      status: "confirmed",
      confirmation_sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});