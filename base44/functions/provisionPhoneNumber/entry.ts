import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

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

    const { area_code } = await req.json().catch(() => ({}));

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

    // Step 3: Save to BusinessProfile
    const profiles = await base44.entities.BusinessProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    if (profile) {
      await base44.entities.BusinessProfile.update(profile.id, {
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