import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { business_name, phone_number, plan_name, booking_url } = await req.json();

    const missingItems = [];
    if (!phone_number) missingItems.push('Phone number (required to receive missed calls)');
    if (!booking_url) missingItems.push('Booking link (required for AI to close appointments)');

    const missingHtml = missingItems.length > 0
      ? `<div style="margin-top:16px;padding:12px;background:#fef9c3;border-radius:8px;border:1px solid #fde047;">
           <strong style="color:#854d0e;">⚠️ Action needed to go fully live:</strong>
           <ul style="margin:8px 0 0 0;padding-left:18px;color:#713f12;">
             ${missingItems.map(i => `<li>${i}</li>`).join('')}
           </ul>
           <p style="margin:8px 0 0 0;color:#713f12;font-size:13px;">Add these in your <a href="https://catchacaller.com/settings" style="color:#3b82f6;">Settings page</a>.</p>
         </div>`
      : `<div style="margin-top:16px;padding:12px;background:#dcfce7;border-radius:8px;border:1px solid #86efac;">
           <strong style="color:#166534;">✅ You're fully set up and ready to capture leads!</strong>
         </div>`;

    await base44.integrations.Core.SendEmail({
      to: user.email,
      from_name: 'CatchACaller',
      subject: `🎉 Welcome to CatchACaller — ${business_name} is live!`,
      body: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
          <div style="background: #3b82f6; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to CatchACaller!</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Your account is ready</p>
          </div>
          <div style="background: white; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 15px;">Hi ${user.full_name || 'there'},</p>
            <p style="color: #475569;">You've successfully set up <strong>${business_name}</strong> on CatchACaller${plan_name ? ` on the <strong>${plan_name}</strong> plan` : ''}. Here's a summary of your setup:</p>

            <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
              <tr style="background:#f8fafc;">
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600;">Business</td>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;">${business_name}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600;">Phone Number</td>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;">${phone_number || '⚠️ Not set yet'}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600;">Plan</td>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;">${plan_name || 'Trial'}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600;">Booking Link</td>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;">${booking_url ? `<a href="${booking_url}" style="color:#3b82f6;">${booking_url}</a>` : '⚠️ Not set yet'}</td>
              </tr>
            </table>

            ${missingHtml}

            <div style="margin-top:24px;text-align:center;">
              <a href="https://catchacaller.com/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Go to Dashboard →</a>
            </div>

            <p style="margin-top:24px;color:#64748b;font-size:13px;">If you need help, just reply to this email or visit your dashboard. We're here to make sure you capture every lead.</p>
            <p style="color:#64748b;font-size:13px;">— The CatchACaller Team</p>
          </div>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendOnboardingConfirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});