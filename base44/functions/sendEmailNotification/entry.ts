import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check first
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, data } = await req.json();

    if (!type || !data || typeof type !== 'string' || typeof data !== 'object') {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Validate allowed types
    const allowedTypes = ['missed_call', 'booking'];
    if (!allowedTypes.includes(type)) {
      return Response.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    let emailSubject = '';
    let emailBody = '';
    const { caller_phone, caller_name, business_name } = data;

    // Sanitize inputs (no HTML injection)
    const sanitized = {
      caller_name: String(caller_name || 'Unknown').substring(0, 100),
      caller_phone: String(caller_phone || 'Unknown').substring(0, 20),
      business_name: String(business_name || 'CatchACaller').substring(0, 100),
    };

    if (type === 'missed_call') {
      emailSubject = `New Missed Call from ${sanitized.caller_name}`;
      emailBody = `
        <h2>${sanitized.business_name} - New Missed Call</h2>
        <p><strong>Caller:</strong> ${sanitized.caller_name}</p>
        <p><strong>Phone:</strong> ${sanitized.caller_phone}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>An SMS auto-response has been sent. Check your Conversations page for updates.</p>
      `;
    } else if (type === 'booking') {
      emailSubject = `New Booking from ${sanitized.caller_name}`;
      emailBody = `
        <h2>${sanitized.business_name} - Booking Confirmed</h2>
        <p><strong>Caller:</strong> ${sanitized.caller_name}</p>
        <p><strong>Phone:</strong> ${sanitized.caller_phone}</p>
        <p>Great news! This lead has clicked your booking link and is ready to schedule.</p>
      `;
    }

    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: emailSubject,
        body: emailBody,
        from_name: sanitized.business_name,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      // Still return success to avoid blocking conversation flow
      // but log the failure for monitoring
    }

    return Response.json({ success: true, email_sent: true });
  } catch (error) {
    console.error('sendEmailNotification error:', error.message);
    // Never expose error details
    return Response.json({ success: false }, { status: 500 });
  }
});