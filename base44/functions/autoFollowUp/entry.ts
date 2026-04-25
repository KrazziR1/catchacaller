import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id } = await req.json();

    const conversation = await base44.asServiceRole.entities.Conversation.get(conversation_id);
    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get business profile for automation settings
    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];

    // Get first followup automation rule
    const rules = await base44.asServiceRole.entities.AutomationRule.filter({
      rule_type: 'first_followup',
      is_enabled: true,
    });

    if (!rules || rules.length === 0) {
      return Response.json({ error: 'No followup rule configured' }, { status: 400 });
    }

    const rule = rules[0];

    // Build message
    let message = '';
    if (rule.sms_template_id) {
      const template = await base44.asServiceRole.entities.SMSTemplate.get(rule.sms_template_id);
      if (template) {
        message = template.message_body
          .replace(/{business_name}/g, profile.business_name)
          .replace(/{caller_name}/g, conversation.caller_name || 'there')
          .replace(/{booking_url}/g, profile.booking_url || '');
      }
    } else {
      message = rule.custom_message;
    }

    if (!message) {
      return Response.json({ error: 'No message configured for rule' }, { status: 400 });
    }

    // Send SMS
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    const client = twilio(accountSid, authToken);

    const smsResult = await client.messages.create({
      body: message,
      from: fromPhone,
      to: conversation.caller_phone,
    });

    // Track message
    const messages = conversation.messages || [];
    messages.push({
      sender: 'human',
      content: message,
      timestamp: new Date().toISOString(),
      sms_status: 'sent',
      sms_id: smsResult.sid,
    });

    await base44.asServiceRole.entities.Conversation.update(conversation_id, {
      messages,
      follow_up_count: (conversation.follow_up_count || 0) + 1,
      last_message_at: new Date().toISOString(),
    });

    return Response.json({ success: true, sms_id: smsResult.sid });
  } catch (error) {
    console.error('autoFollowUp error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});