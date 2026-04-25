import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // Create trial subscription (no plan selected yet)
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_email: user.email,
      status: 'trial',
      trial_end_date: trialEndDate.toISOString(),
      plan_name: null,
      stripe_subscription_id: 'trial_' + Date.now(),
      current_period_end: trialEndDate.toISOString(),
    });

    return Response.json({
      success: true,
      subscription_id: subscription.id,
      trial_end_date: trialEndDate.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});