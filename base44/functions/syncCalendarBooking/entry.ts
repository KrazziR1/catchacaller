import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name, phone, scheduled_time, service_type, calendar_platform } = await req.json();

    if (!email || !phone || !scheduled_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get business profile
    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Create calendar booking record
    const booking = await base44.asServiceRole.entities.CalendarBooking.create({
      conversation_id: null, // Will be set if conversation exists
      caller_phone: phone,
      caller_name: name,
      scheduled_time,
      duration_minutes: 30,
      service_type: service_type || 'Service',
      status: 'scheduled',
      confirmation_sent_at: new Date().toISOString(),
    });

    // Check if conversation exists for this phone
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      caller_phone: phone,
    });

    let conversationId = null;
    if (conversations.length) {
      // Update existing conversation
      conversationId = conversations[0].id;
      await base44.asServiceRole.entities.Conversation.update(conversationId, {
        calendar_booking_id: booking.id,
        status: 'booked',
        booked_at: new Date().toISOString(),
      });
    } else {
      // Create new conversation for booking
      const newConv = await base44.asServiceRole.entities.Conversation.create({
        caller_phone: phone,
        caller_name: name,
        status: 'booked',
        booked_at: new Date().toISOString(),
        calendar_booking_id: booking.id,
        pipeline_stage: 'booked',
      });
      conversationId = newConv.id;
    }

    // Update booking with conversation ref
    await base44.asServiceRole.entities.CalendarBooking.update(booking.id, {
      conversation_id: conversationId,
    });

    // Trigger CRM sync if enabled
    try {
      await base44.asServiceRole.functions.invoke('syncToCRM', {
        conversation_id: conversationId,
        event_type: 'booking_created',
      });
    } catch (e) {
      console.warn('CRM sync failed (non-critical):', e);
    }

    return Response.json({ success: true, booking_id: booking.id, conversation_id: conversationId });
  } catch (error) {
    console.error('syncCalendarBooking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});