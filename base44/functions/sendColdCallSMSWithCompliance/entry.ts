import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

// Rate limit map: phone_number -> [timestamps]
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_SMS_PER_HOUR = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { prospect_id, phone_number, message_body } = await req.json();

    if (!prospect_id || !phone_number || !message_body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate phone format
    if (!/^\+1\d{10}$/.test(phone_number)) {
      return Response.json({ error: 'Invalid phone format' }, { status: 400 });
    }

    // Get prospect details
    const prospects = await base44.asServiceRole.entities.ColdCallProspect.list();
    const currentProspect = prospects.find(p => p.id === prospect_id);
    
    if (!currentProspect) {
      return Response.json({ error: 'Prospect not found' }, { status: 404 });
    }

    // Check DNC status
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({
      phone_number: phone_number
    });

    if (optOuts.length > 0) {
      return Response.json({ 
        error: 'Number is on opt-out list - cannot send' 
      }, { status: 403 });
    }

    // Check rate limiting per phone number
    const now = Date.now();
    const phoneHistory = rateLimitMap.get(phone_number) || [];
    const recentSends = phoneHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

    if (recentSends.length >= MAX_SMS_PER_HOUR) {
      return Response.json({ 
        error: `Rate limit exceeded: max ${MAX_SMS_PER_HOUR} SMS per hour to this number` 
      }, { status: 429 });
    }

    // State-specific compliance checks
    const state = currentProspect.state || 'unknown';
    const requiresExplicitConsent = ['CA', 'NY'].includes(state);

    if (requiresExplicitConsent && !currentProspect.has_consent) {
      return Response.json({ 
        error: `${state} requires explicit consent before SMS. Add consent documentation first.` 
      }, { status: 403 });
    }

    // Add compliance footer to message
    const complianceFooter = '\n\nReply STOP to unsubscribe.';
    const finalMessage = message_body.length + complianceFooter.length <= 160 
      ? message_body + complianceFooter
      : message_body; // Don't add if it exceeds SMS limit

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromPhone) {
      console.error('Missing Twilio config');
      return Response.json({ error: 'Configuration error' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    // Send SMS
    const msg = await client.messages.create({
      body: finalMessage,
      from: fromPhone,
      to: phone_number,
    });

    // Log to ColdCallSMSLog
    await base44.asServiceRole.entities.ColdCallSMSLog.create({
      prospect_id,
      phone_number,
      message_body: finalMessage,
      direction: 'outbound',
      status: 'sent',
      twilio_message_sid: msg.sid,
      sent_at: new Date().toISOString(),
      sent_by: user.email,
    });

    // Log compliance action
    await base44.asServiceRole.entities.ColdCallComplianceLog.create({
      prospect_id,
      phone_number,
      action: 'sms_sent',
      state: state,
      details: `Message sent to prospect in ${state}. Footer added: ${message_body !== finalMessage}`,
      timestamp: new Date().toISOString(),
      performed_by: user.email,
    });

    // Update rate limit tracker
    recentSends.push(now);
    rateLimitMap.set(phone_number, recentSends);

    return Response.json({ 
      success: true, 
      message_sid: msg.sid,
      footerAdded: message_body !== finalMessage
    });
  } catch (error) {
    console.error('sendColdCallSMSWithCompliance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});