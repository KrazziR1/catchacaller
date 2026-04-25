import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { conversation_id, template_id, conversation_ids } = payload;
    
    // Handle single or bulk SMS
    const convoIds = conversation_ids || [conversation_id];
    
    const template = await base44.asServiceRole.entities.SMSTemplate.get(template_id);
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];
    
    if (!profile) {
      return Response.json({ error: 'No business profile' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    const client = twilio(accountSid, authToken);
    // Load opt-out list once
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.list('-created_date', 1000);
    const optOutNumbers = new Set(optOuts.map(o => o.phone_number));

    const results = [];

    for (const convId of convoIds) {
      try {
        const conversation = await base44.asServiceRole.entities.Conversation.get(convId);
        if (!conversation) continue;

        // Check opt-out
        if (optOutNumbers.has(conversation.caller_phone)) {
          results.push({ conversation_id: convId, status: 'skipped', reason: 'opted_out' });
          continue;
        }

        // Replace placeholders
        let message = template.message_body
          .replace(/{business_name}/g, profile.business_name)
          .replace(/{caller_name}/g, conversation.caller_name || 'there')
          .replace(/{booking_url}/g, profile.booking_url || '');

        // Send SMS with optional delay
        if (template.send_delay_seconds > 0) {
          await new Promise(resolve => setTimeout(resolve, template.send_delay_seconds * 1000));
        }

        const msg = await client.messages.create({
          body: message,
          from: fromPhone,
          to: conversation.caller_phone,
        });

        // Log audit
        await base44.asServiceRole.functions.invoke('logSMSAudit', {
          phone_number: conversation.caller_phone,
          business_phone: fromPhone,
          message_body: message,
          message_type: 'follow_up',
          conversation_id: convId,
          status: 'sent',
          twilio_message_sid: msg.sid,
          consent_type: 'called_business',
          sent_by: 'template',
        });

        results.push({ conversation_id: convId, status: 'sent' });
      } catch (error) {
        console.error(`Error sending SMS to conversation ${convId}:`, error);
        results.push({ conversation_id: convId, status: 'error', error: error.message });
      }
    }

    return Response.json({ status: 'completed', results });
  } catch (error) {
    console.error('Template SMS error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});