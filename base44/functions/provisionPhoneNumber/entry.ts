import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = new Stripe(STRIPE_SECRET_KEY);

const twilioFetch = (path, method = "GET", body = null) => {
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const opts = {
    method,
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  if (body) opts.body = new URLSearchParams(body).toString();
  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}${path}`, opts);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethodId, area_code } = await req.json().catch(() => ({}));

    // Prevent duplicate provisioning
    const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    if (profile?.twilio_number_sid) {
      return Response.json({ 
        error: "You already have a provisioned number. Use Settings to change it." 
      }, { status: 400 });
    }

    // Charge $2.99 if payment method provided
    if (paymentMethodId) {
      // Get or create Stripe customer
      let stripeCustomerId = profile?.stripe_customer_id;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_email: user.email },
        });
        stripeCustomerId = customer.id;
        
        // Update profile with Stripe customer ID
        if (profile) {
          await base44.asServiceRole.entities.BusinessProfile.update(profile.id, {
            stripe_customer_id: stripeCustomerId,
          });
        }
      }

      // Create payment intent for $2.99
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 299, // $2.99 in cents
        currency: "usd",
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
        description: "Phone number provisioning",
      });

      if (paymentIntent.status !== "succeeded") {
        return Response.json({ 
          error: `Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}` 
        }, { status: 402 });
      }
    }

    // Derive the base URL from the incoming request host
    const reqUrl = new URL(req.url);
    const BASE_URL = `${reqUrl.protocol}//${reqUrl.host}/functions`;

    // Step 1: Search for an available toll-free number
    const searchParams = new URLSearchParams({ TollFree: "true", Limit: "1" });
    if (area_code) searchParams.set("AreaCode", area_code);

    const searchRes = await twilioFetch(`/AvailablePhoneNumbers/US/TollFree.json?${searchParams}`);
    const searchData = await searchRes.json();

    if (!searchData.available_phone_numbers?.length) {
      return Response.json({ error: "No available toll-free numbers found" }, { status: 404 });
    }

    const numberToBuy = searchData.available_phone_numbers[0].phone_number;

    // Step 2: Purchase the number and set webhooks immediately
    const purchaseRes = await twilioFetch("/IncomingPhoneNumbers.json", "POST", {
      PhoneNumber: numberToBuy,
      VoiceUrl: `${BASE_URL}/missedCallWebhook`,
      VoiceMethod: "POST",
      StatusCallback: `${BASE_URL}/missedCallWebhook`,
      StatusCallbackMethod: "POST",
      SmsUrl: `${BASE_URL}/inboundSMS`,
      SmsMethod: "POST",
      FriendlyName: `CatchACaller - ${user.email}`,
    });

    const purchaseData = await purchaseRes.json();

    if (!purchaseData.sid) {
      return Response.json({ error: "Failed to purchase number", details: purchaseData }, { status: 500 });
    }

    // Step 3: Save to BusinessProfile (we already fetched profile earlier)
    if (profile) {
      await base44.asServiceRole.entities.BusinessProfile.update(profile.id, {
        phone_number: purchaseData.phone_number,
        twilio_number_sid: purchaseData.sid,
      });
    }

    return Response.json({
      success: true,
      phone_number: purchaseData.phone_number,
      sid: purchaseData.sid,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});