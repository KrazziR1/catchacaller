import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate email format
    if (!user.email || typeof user.email !== 'string' || !user.email.includes('@')) {
      return Response.json({ error: 'Invalid user email' }, { status: 400 });
    }

    // Check if trial already exists (idempotency)
    const existing = await base44.asServiceRole.entities.Subscription.filter({ 
      user_email: user.email,
      status: 'trial'
    });

    if (existing.length > 0) {
      console.info(`Trial already exists for ${user.email}`);
      return Response.json({
        success: true,
        subscription_id: existing[0].id,
        trial_end_date: existing[0].trial_end_date,
        message: 'Trial already active',
      });
    }

    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // Create trial subscription with safe ID
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_email: user.email,
      status: 'trial',
      trial_end_date: trialEndDate.toISOString(),
      plan_name: 'Starter',
      stripe_subscription_id: `trial_${Date.now()}`,
      current_period_end: trialEndDate.toISOString(),
    });

    console.info(`Trial created for ${user.email}: expires ${trialEndDate.toISOString()}`);
    return Response.json({
      success: true,
      subscription_id: subscription.id,
      trial_end_date: trialEndDate.toISOString(),
    });
  } catch (error) {
    console.error('Trial creation error:', error.message);
    return Response.json({ error: 'Failed to create trial subscription' }, { status: 500 });
  }
});