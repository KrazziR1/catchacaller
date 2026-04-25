import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    
    const { conversation_id, caller_phone, caller_name } = payload;
    
    // Validate required fields
    if (!caller_phone || typeof caller_phone !== 'string') {
      return Response.json({ error: 'Invalid caller_phone' }, { status: 400 });
    }

    // Get business profile for confirmation message
    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];
    
    if (!profile) {
      return Response.json({ error: 'No business profile found' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    if (!accountSid || !authToken || !fromPhone) {
      console.error('Missing Twilio credentials');
      return Response.json({ error: 'Configuration error' }, { status: 500 });
    }
    
    const client = twilio(accountSid, authToken);

    // Validate full consent before sending
    const consentCheck = await base44.asServiceRole.functions.invoke('validateConsentBeforeSMS', {
      phone_number: caller_phone,
    });

    if (!consentCheck.data?.can_send) {
      console.info(`Booking confirmation blocked for ${caller_phone}: ${consentCheck.data?.reason}`);
      return Response.json({
        status: 'skipped',
        reason: consentCheck.data?.reason || 'consent_invalid',
        phone: caller_phone,
      });
    }
    
    const message = `Hi ${caller_name || 'there'}! Your appointment with ${profile.business_name} is confirmed. ${profile.booking_url || 'We will be in touch soon.'} Reply STOP to opt out.`;
    
    const msg = await client.messages.create({
      body: message,
      from: fromPhone,
      to: caller_phone,
    });

    // Log audit
    await base44.asServiceRole.functions.invoke('logSMSAudit', {
      phone_number: caller_phone,
      business_phone: fromPhone,
      message_body: message,
      message_type: 'booking',
      conversation_id,
      status: 'sent',
      twilio_message_sid: msg.sid,
      consent_type: 'called_business',
      sent_by: 'system',
    });

    console.info(`Booking confirmation sent to ${caller_phone}`);
    return Response.json({ status: 'sent', phone: caller_phone });
  } catch (error) {
    console.error(`Booking confirmation error for ${caller_phone}:`, error.message);
    return Response.json({ error: 'Failed to send confirmation' }, { status: 500 });
  }
});