import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (error) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const eventType = event.type;
    const data = event.data.object;

    if (eventType === 'customer.subscription.created' || eventType === 'customer.subscription.updated') {
      const priceId = data.items.data[0]?.price?.id;
      const planMap = {
        'price_1TPruHFsxP0HXZ0ANSkOGCp0': 'Starter',
        'price_1TPrvMFsxP0HXZ0Apho3zV1j': 'Growth',
        'price_1TPrvzFsxP0HXZ0AP2nb21Ne': 'Pro',
      };
      const planName = planMap[priceId] || data.items.data[0]?.price?.nickname || 'Starter';
      const currentPeriodEnd = new Date(data.current_period_end * 1000).toISOString();
      const trialEndDate = data.trial_end ? new Date(data.trial_end * 1000).toISOString() : null;

      // Find or create subscription record
      const existing = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: data.id,
      });

      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: data.status,
          plan_name: planName,
          current_period_end: currentPeriodEnd,
          trial_end_date: trialEndDate,
        });
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          user_email: data.customer_email || '',
          stripe_customer_id: data.customer,
          stripe_subscription_id: data.id,
          status: data.status,
          plan_name: planName,
          current_period_end: currentPeriodEnd,
          trial_end_date: trialEndDate,
        });
      }
    } else if (eventType === 'customer.subscription.deleted') {
      const existing = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: data.id,
      });

      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});