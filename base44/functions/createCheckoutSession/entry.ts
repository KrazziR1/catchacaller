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

    const payload = await req.json().catch(() => ({}));
    const { priceId } = payload;
    
    const allowedPriceIds = [
      'price_1TPruHFsxP0HXZ0ANSkOGCp0',
      'price_1TPrvMFsxP0HXZ0Apho3zV1j',
      'price_1TPrvzFsxP0HXZ0AP2nb21Ne',
    ];
    if (!priceId || typeof priceId !== 'string' || !allowedPriceIds.includes(priceId)) {
      return Response.json({ error: 'Invalid priceId' }, { status: 400 });
    }

    // Whitelist origin to prevent redirect attacks
    const origin = req.headers.get('origin');
    const allowedOrigins = ['https://catchacaller.com', 'http://localhost:5173'];
    const safeOrigin = (origin && allowedOrigins.some(o => origin.includes(o))) ? origin : 'https://catchacaller.com';

    // Get or create Stripe customer object to link to trial subscription later
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const newCustomer = await stripe.customers.create({ email: user.email });
      customerId = newCustomer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      success_url: `${safeOrigin}/checkout-success`,
      cancel_url: `${safeOrigin}/#pricing`,
    });

    console.info(`Checkout session created for ${user.email}: ${session.id}`);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error(`Checkout error for ${user.email}:`, error.message);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
});