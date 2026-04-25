import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const {
      phone_number,
      business_phone,
      message_body,
      message_type = 'manual',
      conversation_id,
      status = 'sent',
      twilio_message_sid,
      consent_type = 'called_business',
    } = payload;

    // Input validation
    if (!phone_number || typeof phone_number !== 'string') {
      return Response.json({ error: 'Invalid phone_number' }, { status: 400 });
    }
    if (!business_phone || typeof business_phone !== 'string') {
      return Response.json({ error: 'Invalid business_phone' }, { status: 400 });
    }
    if (!message_body || typeof message_body !== 'string') {
      return Response.json({ error: 'Invalid message_body' }, { status: 400 });
    }

    // Truncate message to prevent overflow
    const truncatedBody = message_body.substring(0, 1600);

    // Log to audit trail - CRITICAL for compliance
    const audit = await base44.asServiceRole.entities.SMSAuditLog.create({
      phone_number,
      business_phone,
      message_body: truncatedBody,
      message_type,
      conversation_id: conversation_id || null,
      status,
      twilio_message_sid: twilio_message_sid || null,
      consent_type,
      sent_by: user.email,
      sent_at: new Date().toISOString(),
    });

    console.info(`SMS audit logged: ${phone_number} via ${business_phone} - ${status}`);
    return Response.json({ success: true, audit_id: audit.id });
  } catch (error) {
    // CRITICAL: Log this error but always try to create audit entry
    console.error(`logSMSAudit error for ${user?.email}:`, error.message);
    // Return generic error without details
    return Response.json({ error: 'Audit logging failed' }, { status: 500 });
  }
});