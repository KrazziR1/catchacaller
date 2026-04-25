import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

// Rate limiting
const smsSendLimits = new Map();

function checkSMSRateLimit(userId) {
  const now = Date.now();
  const limit = 100; // max 100 SMS per hour
  const window = 3600000;
  
  if (!smsSendLimits.has(userId)) {
    smsSendLimits.set(userId, []);
  }
  
  const timestamps = smsSendLimits.get(userId);
  const filtered = timestamps.filter(ts => now - ts < window);
  smsSendLimits.set(userId, filtered);
  
  if (filtered.length >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  filtered.push(now);
  return { allowed: true, remaining: limit - filtered.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const rateCheck = checkSMSRateLimit(user.email);
    if (!rateCheck.allowed) {
      console.warn(`SMS rate limit exceeded for ${user.email}`);
      return Response.json({ error: "SMS rate limit exceeded (100 per hour)" }, { status: 429 });
    }

    const payload = await req.json().catch(() => ({}));
    const { conversation_id, template_id, conversation_ids } = payload;
    
    // Validate inputs
    if (!template_id || typeof template_id !== 'string') {
      return Response.json({ error: 'Invalid template_id' }, { status: 400 });
    }

    // Handle single or bulk SMS
    const convoIds = conversation_ids || [conversation_id];
    
    if (!convoIds || !Array.isArray(convoIds) || convoIds.length === 0) {
      return Response.json({ error: 'conversation_id or conversation_ids required' }, { status: 400 });
    }

    if (convoIds.length > 50) {
      return Response.json({ error: 'Cannot send to more than 50 conversations at once' }, { status: 400 });
    }

    // Verify user owns profile
    const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({ created_by: user.email });
    if (profiles.length === 0) {
      return Response.json({ error: 'No business profile found' }, { status: 400 });
    }
    const profile = profiles[0];
    
    const template = await base44.asServiceRole.entities.SMSTemplate.get(template_id);
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
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

        // Validate full consent before sending
        const consentCheck = await base44.asServiceRole.functions.invoke('validateConsentBeforeSMS', {
          phone_number: conversation.caller_phone,
        });

        if (!consentCheck.data?.can_send) {
          results.push({
            conversation_id: convId,
            status: 'skipped',
            reason: consentCheck.data?.reason || 'consent_invalid',
          });
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

    console.info(`Templated SMS sent by ${user.email}: ${convoIds.length} conversations, ${results.filter(r => r.status === 'sent').length} successful`);
    return Response.json({ status: 'completed', results });
  } catch (error) {
    console.error(`Template SMS error for ${user.email}:`, error.message);
    return Response.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
});