import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();
    const allowedPriceIds = [
      'price_1TPruHFsxP0HXZ0ANSkOGCp0',
      'price_1TPrvMFsxP0HXZ0Apho3zV1j',
      'price_1TPrvzFsxP0HXZ0AP2nb21Ne',
    ];
    if (!priceId || !allowedPriceIds.includes(priceId)) {
      return Response.json({ error: 'Invalid priceId' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://catchacaller.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: `${origin}/checkout-success`,
      cancel_url: `${origin}/#pricing`,
      subscription_data: {
        trial_period_days: 7,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});