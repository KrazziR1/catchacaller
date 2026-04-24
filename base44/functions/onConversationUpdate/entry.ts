import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { event, data, old_data, changed_fields } = payload;
    
    if (event.type !== 'update' || event.entity_name !== 'Conversation') {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    // Check if pipeline_stage or booking_link_sent changed
    const stageChanged = changed_fields?.includes('pipeline_stage');
    const statusChanged = changed_fields?.includes('status');
    
    if (!stageChanged && !statusChanged) {
      return Response.json({ status: 'no_action' });
    }

    const conversation = data;
    
    // SMS on booking confirmation (only if NOT already sent)
    if (conversation.pipeline_stage === 'booked' && !conversation.booking_link_sent) {
      await base44.functions.invoke('sendBookingConfirmationSMS', {
        conversation_id: conversation.id,
        caller_phone: conversation.caller_phone,
        caller_name: conversation.caller_name,
      });
      
      // Mark booking link as sent to prevent duplicate SMS
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        booking_link_sent: true,
      });
    }

    // CRM sync on stage changes
    if (stageChanged && conversation.pipeline_stage) {
      await base44.functions.invoke('syncToCRM', {
        conversation_id: conversation.id,
      });
    }

    return Response.json({ status: 'success', processed: true });
  } catch (error) {
    console.error('Conversation update handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});