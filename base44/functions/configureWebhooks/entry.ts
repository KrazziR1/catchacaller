import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const twilioFetch = (accountSid, authToken, path, method = "GET", body = null) => {
  const credentials = btoa(`${accountSid}:${authToken}`);
  const opts = {
    method,
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  if (body) opts.body = new URLSearchParams(body).toString();
  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}${path}`, opts);
};

// Finds an existing Twilio number by phone number string and updates its webhooks
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

    // Derive base URL from the incoming request
    const reqUrl = new URL(req.url);
    const BASE_URL = `${reqUrl.protocol}//${reqUrl.host}/functions`;

    // Get the phone number to configure from the business profile
    const profiles = await base44.entities.BusinessProfile.filter({ created_by: user.email });
    const profile = profiles[0];
    const phoneNumber = profile?.phone_number;

    if (!phoneNumber) {
      return Response.json({ error: "No phone number found in your business profile. Please add one in Settings first." }, { status: 400 });
    }

    // Normalize to E.164 so we can look it up
    const normalized = phoneNumber.replace(/\D/g, '');
    const e164 = normalized.startsWith('1') ? `+${normalized}` : `+1${normalized}`;

    // Find the number in Twilio account
    const listRes = await twilioFetch(accountSid, authToken, `/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(e164)}`);
    const listData = await listRes.json();

    if (!listData.incoming_phone_numbers?.length) {
      return Response.json({
        error: `The number ${e164} was not found in your Twilio account. Make sure it matches a number you own in Twilio.`
      }, { status: 404 });
    }

    const numberSid = listData.incoming_phone_numbers[0].sid;

    // Update the webhooks on that number
    const updateRes = await twilioFetch(accountSid, authToken, `/IncomingPhoneNumbers/${numberSid}.json`, "POST", {
      VoiceUrl: `${BASE_URL}/missedCallWebhook`,
      VoiceMethod: "POST",
      StatusCallback: `${BASE_URL}/missedCallWebhook`,
      StatusCallbackMethod: "POST",
      SmsUrl: `${BASE_URL}/inboundSMS`,
      SmsMethod: "POST",
    });

    const updateData = await updateRes.json();

    if (!updateData.sid) {
      return Response.json({ error: "Failed to update webhooks", details: updateData }, { status: 500 });
    }

    // Save the SID to the profile
    if (profile) {
      await base44.entities.BusinessProfile.update(profile.id, {
        twilio_number_sid: updateData.sid,
      });
    }

    return Response.json({
      success: true,
      phone_number: updateData.phone_number,
      voice_url: updateData.voice_url,
      sms_url: updateData.sms_url,
    });
  } catch (error) {
    console.error("configureWebhooks error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});