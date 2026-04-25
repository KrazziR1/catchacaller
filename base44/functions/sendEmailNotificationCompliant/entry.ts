// Send email notification with compliance checks (non-customer email — to business owner)
// NOTE: This is for business owner notifications, not end-user contact
// Still respects their email communication preferences
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to_email, subject, body, from_name } = await req.json();

    if (!to_email || !subject || !body) {
      return Response.json({
        error: 'to_email, subject, and body required',
      }, { status: 400 });
    }

    // Load the business profile to check email notification preference
    const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({
      created_by: user.email,
    });

    if (profiles.length === 0) {
      return Response.json({
        error: 'No business profile found',
      }, { status: 404 });
    }

    const profile = profiles[0];

    // COMPLIANCE CHECK: Respect the business owner's email notification settings
    if (!profile.email_notifications_enabled) {
      return Response.json({
        success: true,
        skipped: true,
        reason: 'email_notifications_disabled',
      });
    }

    // Send the email
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: to_email,
      subject,
      body,
      from_name: from_name || 'CatchACaller',
    });

    return Response.json({
      success: true,
      message: 'Email sent',
      recipient: to_email,
    });
  } catch (error) {
    console.error('sendEmailNotificationCompliant error:', error);
    return Response.json({
      error: error.message,
    }, { status: 500 });
  }
});