import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { conversation_id, caller_phone, caller_name } = payload;
    
    // Get business profile for confirmation message
    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];
    
    if (!profile) {
      return Response.json({ error: 'No business profile found' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    const client = twilio(accountSid, authToken);

    // Check opt-out
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: caller_phone });
    if (optOuts.length > 0) {
      return Response.json({ status: 'skipped', reason: 'opted_out', phone: caller_phone });
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

    console.log(`✓ SMS sent to ${caller_phone}`);
    return Response.json({ status: 'sent', phone: caller_phone });
  } catch (error) {
    console.error('SMS send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});