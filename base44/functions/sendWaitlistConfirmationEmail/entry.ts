import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, business_name } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Welcome to CatchACaller Waitlist',
      body: `
        <h2>You're on the list!</h2>
        <p>Hi ${business_name || 'there'},</p>
        <p>Thanks for joining the CatchACaller waitlist. We're excited to get you set up!</p>
        <p>Our team will reach out within 24 hours to:</p>
        <ul>
          <li>Provision your dedicated toll-free number</li>
          <li>Configure your AI personality</li>
          <li>Set up your first SMS templates</li>
          <li>Launch your first automated response</li>
        </ul>
        <p><strong>In the meantime:</strong> Check out our <a href="https://catchacaller.com">help docs</a> to learn how the platform works.</p>
        <p>Questions? Reply to this email or visit our support center.</p>
        <p>Best,<br/>The CatchACaller Team</p>
      `,
      from_name: 'CatchACaller',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendWaitlistConfirmationEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});