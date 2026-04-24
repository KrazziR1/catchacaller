import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  const subscription = event.data.object;
  const customerEmail = subscription.customer_email || 
    (await stripe.customers.retrieve(subscription.customer)).email;

  const statusMap = {
    'customer.subscription.created': 'active',
    'customer.subscription.updated': subscription.status === 'active' ? 'active' : subscription.status,
    'customer.subscription.deleted': 'cancelled',
    'invoice.payment_failed': 'past_due',
  };

  const newStatus = statusMap[event.type];
  if (!newStatus || !customerEmail) {
    return Response.json({ received: true });
  }

  // Find the user by email and update their subscription status
  const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
  if (users.length > 0) {
    const planNickname = subscription.items?.data?.[0]?.price?.nickname || 
                         subscription.items?.data?.[0]?.plan?.nickname || null;
    await base44.asServiceRole.entities.User.update(users[0].id, {
      subscription_status: newStatus,
      subscription_plan: planNickname,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
    });
  }

  return Response.json({ received: true });
});