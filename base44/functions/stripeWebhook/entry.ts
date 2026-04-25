import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    // CRITICAL: Validate webhook signature BEFORE initializing base44
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (error) {
      console.warn('Invalid Stripe signature');
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // NOW safe to initialize base44
    const base44 = createClientFromRequest(req);

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
        // Update existing subscription
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          stripe_subscription_id: data.id,
          status: data.status,
          plan_name: planName,
          current_period_end: currentPeriodEnd,
          trial_end_date: trialEndDate,
          stripe_customer_id: data.customer,
        });
      } else {
        // Check if trial subscription exists for this customer and link it
        let userEmail = data.customer_email || '';
        if (!userEmail && data.customer) {
          const customer = await stripe.customers.retrieve(data.customer);
          userEmail = customer.email || '';
        }
        
        // Look for existing trial subscription by email
        const trialSubs = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail });
        if (trialSubs.length > 0 && trialSubs[0].status === 'trial') {
          // Update trial subscription to paid plan
          await base44.asServiceRole.entities.Subscription.update(trialSubs[0].id, {
            stripe_subscription_id: data.id,
            stripe_customer_id: data.customer,
            status: data.status,
            plan_name: planName,
            current_period_end: currentPeriodEnd,
            trial_end_date: trialEndDate,
          });
        } else {
          // Create new subscription
          await base44.asServiceRole.entities.Subscription.create({
            user_email: userEmail,
            stripe_customer_id: data.customer,
            stripe_subscription_id: data.id,
            status: data.status,
            plan_name: planName,
            current_period_end: currentPeriodEnd,
            trial_end_date: trialEndDate,
          });
        }
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
    console.error('stripeWebhook fatal error:', error.message);
    // Never expose error details in webhook response
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
});