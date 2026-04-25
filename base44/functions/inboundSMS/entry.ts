import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

// Twilio sends inbound SMS as URL-encoded form data
async function parseFormBody(req) {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

Deno.serve(async (req) => {
  try {
    // Twilio sends POST with form data
    const body = await parseFormBody(req);
    const { From, To, Body } = body;

    if (!From || !Body) {
      return new Response('Missing required fields', { status: 400 });
    }

    const inboundText = Body.trim();
    const callerPhone = From;

    const base44 = createClientFromRequest(req);

    // --- Opt-out handling ---
    const optOutKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
    const optInKeywords = ['START', 'UNSTOP', 'YES'];
    const upperText = inboundText.toUpperCase();

    if (optOutKeywords.includes(upperText)) {
      // Record opt-out
      const existing = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.SMSOptOut.create({
          phone_number: callerPhone,
          opted_out_at: new Date().toISOString(),
          opt_out_keyword: upperText,
          business_phone: To,
        });
      }
      // Twilio auto-handles STOP carrier acknowledgment, just return empty TwiML
      return new Response('<Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    if (optInKeywords.includes(upperText)) {
      // Remove from opt-out list if they re-subscribe
      const existing = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
      for (const record of existing) {
        await base44.asServiceRole.entities.SMSOptOut.delete(record.id);
      }
      return new Response('<Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // --- Check if opted out ---
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
    if (optOuts.length > 0) {
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Load business profile ---
    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];
    if (!profile || !profile.auto_response_enabled) {
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Find existing conversation ---
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ caller_phone: callerPhone });
    let conversation = conversations.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

    // --- Build conversation history for AI context ---
    const recentMessages = conversation?.messages?.slice(-10) || [];
    const historyText = recentMessages.map(m =>
      `${m.sender === 'lead' ? 'Lead' : 'Business'}: ${m.content}`
    ).join('\n');

    // --- Call AI to generate response ---
    const personalityInstructions = profile.ai_personality === 'professional'
      ? 'Use a professional, formal tone. Be concise and business-like.'
      : 'Use a warm, friendly, conversational tone. Be personable and approachable.';

    const bookingInstruction = profile.booking_url
      ? `When the lead is ready to book or asks about scheduling, share this link: ${profile.booking_url}`
      : 'When the lead wants to book, let them know the team will reach out to schedule.';

    const isFirstReply = recentMessages.length === 0;

    const prompt = `You are an AI assistant representing ${profile.business_name}, a ${profile.industry} business. Respond to an incoming SMS from a potential customer who previously called and was missed.

${personalityInstructions}

Business hours: ${profile.business_hours || 'Mon-Fri 9am-5pm'}
${bookingInstruction}

Rules:
- Keep responses SHORT (1-3 sentences max). This is SMS.
- Be helpful, qualify their need, and move them toward booking.
- If they mention urgency or emergency, prioritize speed.
- Never pretend to be human if directly asked — say you're an AI assistant for ${profile.business_name}.
- Always end with a question or clear next step.
- ${isFirstReply ? 'Include "Reply STOP to opt out." at the end of this first message.' : 'Do NOT include opt-out instructions again.'}
- Do NOT use excessive emojis.

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

The lead just sent: "${inboundText}"

Write the SMS reply text only. No quotes, no labels.`;

    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    const replyText = typeof aiResult === 'string' ? aiResult.trim() : String(aiResult).trim();

    // --- Send SMS via Twilio ---
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER') || To;
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: replyText,
      from: fromPhone,
      to: callerPhone,
    });

    // --- Update conversation record ---
    const now = new Date().toISOString();
    const newMessages = [...(conversation?.messages || [])];

    // Add inbound message
    newMessages.push({
      sender: 'lead',
      content: inboundText,
      timestamp: now,
    });

    // Add AI reply
    newMessages.push({
      sender: 'ai',
      content: replyText,
      timestamp: now,
      sms_status: 'sent',
    });

    if (conversation) {
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        messages: newMessages,
        last_message_at: now,
        last_inbound_at: now,
        status: conversation.status === 'unresponsive' ? 'active' : conversation.status,
      });
    } else {
      // Create new conversation if none exists
      await base44.asServiceRole.entities.Conversation.create({
        caller_phone: callerPhone,
        messages: newMessages,
        last_message_at: now,
        last_inbound_at: now,
        status: 'active',
      });
    }

    // Return empty TwiML (we already sent via REST API to avoid double-send)
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('inboundSMS error:', error);
    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  }
});