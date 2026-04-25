import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// This endpoint handles inbound SMS replies from leads
// Configure in Twilio console: Messaging → Phone Number → "A message comes in" → set to this webhook URL

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const params = new URLSearchParams(body);

    const from = params.get("From");
    const messageBody = params.get("Body")?.trim();

    if (!from || !messageBody) {
      return new Response("<?xml version='1.0'?><MessagingResponse></MessagingResponse>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // TCPA compliance: honor opt-out keywords immediately
    const optOutKeywords = ["stop", "stopall", "unsubscribe", "cancel", "end", "quit"];
    const optInKeywords = ["start", "yes", "unstop"];
    const normalizedBody = messageBody.toLowerCase().trim();

    if (optOutKeywords.includes(normalizedBody)) {
      // Mark all active conversations as opted out
      const activeConvos = await base44.asServiceRole.entities.Conversation.filter({ caller_phone: from, status: "active" });
      for (const c of activeConvos) {
        await base44.asServiceRole.entities.Conversation.update(c.id, { status: "lost", messages: [
          ...(c.messages || []),
          { sender: "lead", content: messageBody, timestamp: new Date().toISOString() },
          { sender: "ai", content: "You have been unsubscribed and will receive no further messages.", timestamp: new Date().toISOString() }
        ]});
      }
      // Twilio auto-handles STOP replies per carrier rules — return empty response
      return new Response("<?xml version='1.0'?><MessagingResponse></MessagingResponse>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Find existing conversation for this phone number
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      caller_phone: from,
      status: "active",
    });

    const now = new Date().toISOString();

    if (conversations.length === 0) {
      console.log(`No active conversation found for ${from}`);
      return new Response("<?xml version='1.0'?><MessagingResponse></MessagingResponse>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Always use the most recent active conversation to avoid duplicates
    const conversation = conversations.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    const messages = conversation.messages || [];

    // Rate limiting: ignore if last inbound was less than 10 seconds ago
    const lastInbound = conversation.last_inbound_at ? new Date(conversation.last_inbound_at) : null;
    if (lastInbound && (Date.now() - lastInbound.getTime()) < 10000) {
      console.warn(`Rate limit: ignoring rapid message from ${from}`);
      return new Response("<?xml version='1.0'?><MessagingResponse></MessagingResponse>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Append the lead's message
    messages.push({
      sender: "lead",
      content: messageBody,
      timestamp: now,
    });

    // Fetch the business profile that owns the number that received this SMS
    const receivingNumber = params.get("To");
    const profiles = receivingNumber
      ? await base44.asServiceRole.entities.BusinessProfile.filter({ phone_number: receivingNumber })
      : [];
    const profile = profiles[0] || (await base44.asServiceRole.entities.BusinessProfile.list("-created_date", 1))[0];

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a friendly, professional AI assistant for ${profile?.business_name || "a service business"} (${profile?.industry || "general"} industry).
A potential customer just texted back: "${messageBody}"

Conversation so far:
${messages.map((m) => `${m.sender === "lead" ? "Customer" : "You"}: ${m.content}`).join("\n")}

Write a short, helpful SMS reply (max 2 sentences). Your goal is to understand their need and guide them to book an appointment.
${profile?.booking_url ? `If they seem ready to book, include this link: ${profile.booking_url}` : ""}
Tone: ${profile?.ai_personality || "friendly"}. Do NOT use emojis excessively. Keep it concise.`,
    });

    const aiReply = typeof aiResponse === 'string' ? aiResponse : (aiResponse?.data ?? aiResponse?.message ?? '');

    // Append AI reply
    messages.push({
      sender: "ai",
      content: aiReply,
      timestamp: new Date().toISOString(),
    });

    // Update conversation
    await base44.asServiceRole.entities.Conversation.update(conversation.id, {
      messages,
      last_message_at: now,
      last_inbound_at: now,
      follow_up_count: (conversation.follow_up_count || 0) + 1,
    });

    // Update missed call status
    if (conversation.missed_call_id) {
      await base44.asServiceRole.entities.MissedCall.update(conversation.missed_call_id, {
        status: "replied",
      });
    }

    // Send the AI reply via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    // Use the number that received the inbound message (the "To" field from Twilio)
    const toNumber = params.get("To") || Deno.env.get("TWILIO_PHONE_NUMBER");

    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
        body: new URLSearchParams({
          From: toNumber,
          To: from,
          Body: aiReply,
        }),
      }
    );

    return new Response("<?xml version='1.0'?><MessagingResponse></MessagingResponse>", {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("twilioInboundSMS error:", error.message);
    return new Response("<?xml version='1.0'?><MessagingResponse></MessagingResponse>", {
      headers: { "Content-Type": "text/xml" },
    });
  }
});