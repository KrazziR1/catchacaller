import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = new Stripe(STRIPE_SECRET_KEY);

// Rate limiting map
const provisionLimits = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const limit = 5; // max 5 provisions per hour
  const window = 3600000; // 1 hour
  
  if (!provisionLimits.has(userId)) {
    provisionLimits.set(userId, []);
  }
  
  const timestamps = provisionLimits.get(userId);
  const filtered = timestamps.filter(ts => now - ts < window);
  provisionLimits.set(userId, filtered);
  
  if (filtered.length >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  filtered.push(now);
  return { allowed: true, remaining: limit - filtered.length };
}

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

    // Rate limit check
    const rateCheck = checkRateLimit(user.email);
    if (!rateCheck.allowed) {
      console.warn(`Rate limit exceeded for ${user.email}`);
      return Response.json({ error: "Too many provision requests. Try again in 1 hour." }, { status: 429 });
    }

    const payload = await req.json().catch(() => ({}));
    const { paymentMethodId, area_code } = payload;
    
    // Validate area code if provided
    if (area_code && (typeof area_code !== 'string' || !/^\d{3}$/.test(area_code))) {
      return Response.json({ error: "Invalid area code format" }, { status: 400 });
    }

    // Verify user owns a profile
    const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({ created_by: user.email });
    if (profiles.length === 0) {
      return Response.json({ error: "No business profile found" }, { status: 400 });
    }
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

      // Store the charge ID for future refunds
      const charges = await stripe.charges.list({ payment_intent: paymentIntent.id, limit: 1 });
      const chargeId = charges.data[0]?.id;
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
     const updateData = {
       phone_number: purchaseData.phone_number,
       twilio_number_sid: purchaseData.sid,
     };
     if (chargeId) {
       updateData.stripe_provisioning_charge_id = chargeId;
     }
     await base44.asServiceRole.entities.BusinessProfile.update(profile.id, updateData);
    }

    console.info(`Phone provisioned for ${user.email}: ${purchaseData.phone_number}`);
    return Response.json({
      success: true,
      phone_number: purchaseData.phone_number,
      sid: purchaseData.sid,
    });
  } catch (error) {
    console.error(`Provision error for ${user.email}:`, error.message);
    // Don't expose detailed error to client
    return Response.json({ error: "Provisioning failed. Please try again or contact support." }, { status: 500 });
  }
});