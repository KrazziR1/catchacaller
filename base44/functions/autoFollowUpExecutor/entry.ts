import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';
import { differenceInHours } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all enabled automation rules
    const rules = await base44.asServiceRole.entities.AutomationRule.filter({ is_enabled: true });
    
    if (!rules.length) {
      return Response.json({ processed: 0, success: true });
    }

    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 100);
    const conversations = await base44.asServiceRole.entities.Conversation.list('-created_date', 500);
    
    // Load opt-out list once
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.list('-created_date', 1000);
    const optOutNumbers = new Set(optOuts.map(o => o.phone_number));
    
    let processed = 0;
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    const client = twilio(accountSid, authToken);

    for (const rule of rules) {
      if (rule.trigger_condition !== 'no_response_hours') continue;

      const profile = profiles.find(p => p.id === rule.business_profile_id);
      if (!profile) continue;

      // Find conversations matching this rule's business
      const relevantConvs = conversations.filter(c => c.created_by === profile.created_by);

      for (const conv of relevantConvs) {
        const hoursSinceLastMsg = differenceInHours(
          new Date(),
          new Date(conv.last_message_at || conv.created_date)
        );

        // Check if enough time has passed
        if (hoursSinceLastMsg >= rule.hours_delay && conv.status === 'active') {
          // Check opt-out
          if (optOutNumbers.has(conv.caller_phone)) {
            continue;
          }
          
          try {
            let messageBody = rule.custom_message || '';
            
            // If using template, fetch it
            if (rule.sms_template_id) {
              const template = await base44.asServiceRole.entities.SMSTemplate.filter({ id: rule.sms_template_id });
              if (template.length) {
                messageBody = template[0].message_body;
              }
            }

            // Replace placeholders
            messageBody = messageBody
              .replace('{caller_name}', conv.caller_name || 'there')
              .replace('{business_name}', profile.business_name);

            // Send via Twilio
            const msg = await client.messages.create({
              body: messageBody,
              from: fromPhone,
              to: conv.caller_phone,
            });

            // Log to audit
            await base44.asServiceRole.functions.invoke('logSMSAudit', {
              phone_number: conv.caller_phone,
              business_phone: fromPhone,
              message_body: messageBody,
              message_type: 'follow_up',
              conversation_id: conv.id,
              status: 'sent',
              twilio_message_sid: msg.sid,
              consent_type: 'called_business',
              sent_by: 'automation',
            });

            // Update conversation
            await base44.asServiceRole.entities.Conversation.update(conv.id, {
              follow_up_count: (conv.follow_up_count || 0) + 1,
              last_message_at: new Date().toISOString(),
            });

            processed++;
          } catch (e) {
            console.error(`Auto follow-up failed for ${conv.id}:`, e);
          }
        }
      }
    }

    return Response.json({ processed, success: true });
  } catch (error) {
    console.error('autoFollowUpExecutor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});