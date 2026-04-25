import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      phone_number,
      business_phone,
      message_body,
      message_type = 'manual',
      conversation_id,
      status = 'sent',
      twilio_message_sid,
      consent_type = 'called_business',
    } = await req.json();

    if (!phone_number || !business_phone || !message_body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log to audit trail
    const audit = await base44.entities.SMSAuditLog.create({
      phone_number,
      business_phone,
      message_body,
      message_type,
      conversation_id,
      status,
      twilio_message_sid,
      consent_type,
      sent_by: user.email,
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true, audit_id: audit.id });
  } catch (error) {
    console.error('logSMSAudit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});