import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// This endpoint is called by Twilio when a call is missed (no answer / busy / failed)
// Configure this URL in Twilio console: Voice → Phone Number → "A call comes in" → set to webhook
// AND set "Call Status Changes" webhook to this same URL

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const params = new URLSearchParams(body);

    const callStatus = params.get("CallStatus");
    const callerPhone = params.get("From");
    const calledPhone = params.get("To");
    const callSid = params.get("CallSid");

    // Only act on missed/no-answer calls
    const missedStatuses = ["no-answer", "busy", "failed"];
    if (!missedStatuses.includes(callStatus)) {
      return new Response("<?xml version='1.0'?><Response></Response>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (!callerPhone) {
      return new Response("<?xml version='1.0'?><Response></Response>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Log the missed call
    const missedCall = await base44.asServiceRole.entities.MissedCall.create({
      caller_phone: callerPhone,
      call_time: new Date().toISOString(),
      status: "new",
      notes: `CallSid: ${callSid} | Status: ${callStatus}`,
    });

    // Fetch the business profile that owns this phone number
    const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({ phone_number: calledPhone });
    const profile = profiles[0] || (await base44.asServiceRole.entities.BusinessProfile.list("-created_date", 1))[0];

    // Fetch the best active initial response template
    const templates = await base44.asServiceRole.entities.SMSTemplate.filter({
      category: "initial_response",
      is_active: true,
    });

    let messageBody;
    if (templates.length > 0) {
      const t = templates[0];
      messageBody = t.message_body
        .replace("{business_name}", profile?.business_name || "us")
        .replace("{caller_name}", "")
        .trim();
    } else {
      const businessName = profile?.business_name || "our team";
      messageBody = `Hi! Sorry we missed your call from ${businessName}. We want to help — what can we assist you with today?`;
    }

    // Send the SMS via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    const smsSentAt = new Date().toISOString();
    const responseTimeSeconds = 3; // near-instant

    // Use the number that was called (calledPhone) if available, else fall back to env var
    const smsFrom = calledPhone || fromNumber;

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
        body: new URLSearchParams({
          From: smsFrom,
          To: callerPhone,
          Body: messageBody,
        }),
      }
    );

    const twilioData = await twilioRes.json();

    if (twilioData.error_code) {
      console.error("Twilio SMS error:", twilioData);
    } else {
      // Update missed call record to sms_sent
      await base44.asServiceRole.entities.MissedCall.update(missedCall.id, {
        status: "sms_sent",
        sms_sent_at: smsSentAt,
        response_time_seconds: responseTimeSeconds,
      });

      // Create a conversation thread
      await base44.asServiceRole.entities.Conversation.create({
        missed_call_id: missedCall.id,
        caller_phone: callerPhone,
        status: "active",
        messages: [
          {
            sender: "ai",
            content: messageBody,
            timestamp: smsSentAt,
          },
        ],
        last_message_at: smsSentAt,
      });
    }

    // Return empty TwiML (no voice response needed)
    return new Response("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("twilioWebhook error:", error.message);
    return new Response("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }
});