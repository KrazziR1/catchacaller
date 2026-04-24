import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, data } = await req.json();

    if (!type || !data) {
      return Response.json({ error: 'Missing type or data' }, { status: 400 });
    }

    let emailSubject = '';
    let emailBody = '';

    if (type === 'missed_call') {
      const { caller_phone, caller_name, business_name } = data;
      emailSubject = `New Missed Call from ${caller_name || caller_phone}`;
      emailBody = `
        <h2>${business_name} - New Missed Call</h2>
        <p><strong>Caller:</strong> ${caller_name || 'Unknown'}</p>
        <p><strong>Phone:</strong> ${caller_phone}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>An SMS auto-response has been sent. Check your Conversations page for updates.</p>
      `;
    } else if (type === 'booking') {
      const { caller_name, caller_phone, business_name } = data;
      emailSubject = `🎉 New Booking from ${caller_name || caller_phone}`;
      emailBody = `
        <h2>${business_name} - Booking Confirmed</h2>
        <p><strong>Caller:</strong> ${caller_name || 'Unknown'}</p>
        <p><strong>Phone:</strong> ${caller_phone}</p>
        <p>Great news! This lead has clicked your booking link and is ready to schedule.</p>
      `;
    } else {
      return Response.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: emailSubject,
      body: emailBody,
      from_name: data.business_name || 'CatchACaller',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendEmailNotification error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});