import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

// In-memory rate limiter (5 SMS per hour per phone number)
const smsRateLimits = new Map();

function checkSMSRateLimit(phoneNumber) {
  const now = Date.now();
  const oneHour = 3600000;

  if (!smsRateLimits.has(phoneNumber)) {
    smsRateLimits.set(phoneNumber, []);
  }

  const timestamps = smsRateLimits.get(phoneNumber);
  const recent = timestamps.filter(ts => now - ts < oneHour);

  if (recent.length >= 5) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((recent[0] + oneHour - now) / 1000),
    };
  }

  recent.push(now);
  smsRateLimits.set(phoneNumber, recent);
  return { allowed: true, remaining: 5 - recent.length };
}

async function parseFormBody(req) {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function verifyTwilioRequest(signature, url, params, authToken) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(url + Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], ''));
    const key = encoder.encode(authToken);
    return crypto.subtle.sign('HMAC', key, data).then(sig => {
      const hash = btoa(String.fromCharCode(...new Uint8Array(sig)));
      return hash === signature;
    });
  } catch {
    return Promise.resolve(false);
  }
}

// Normalize any phone format to E.164 (+1XXXXXXXXXX)
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

Deno.serve(async (req) => {
  try {
    // Validate environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!accountSid || !authToken) {
      console.error('CRITICAL: Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
      return new Response('Config error', { status: 500 });
    }

    const body = await parseFormBody(req);
    const { From, To, Body } = body;
    const signature = req.headers.get('x-twilio-signature') || '';

    // Verify Twilio signature
    const isValid = await verifyTwilioRequest(signature, req.url, body, authToken);
    if (!isValid) {
      console.warn('Webhook signature verification failed - unauthorized');
      return new Response('Unauthorized', { status: 401 });
    }

    if (!From || !Body) {
      return new Response('Missing required fields', { status: 400 });
    }

    let inboundText = Body.trim();
    const callerPhone = normalizePhone(From);
    const toPhone = normalizePhone(To); // The business's Twilio number that received the SMS
    const messageSid = body.MessageSid;

    // Sanitize input to prevent prompt injection
    inboundText = inboundText.replace(/[<>{}]/g, '').slice(0, 1000);

    const base44 = createClientFromRequest(req);

    // --- Idempotency: Check if we already processed this SMS ---
    // Deduplicate by MessageSid (Twilio's unique identifier for SMS)
    if (messageSid) {
      const existingMessages = await base44.asServiceRole.entities.SMSAuditLog.filter({
        twilio_message_sid: messageSid
      }).catch(() => []);
      
      if (existingMessages.length > 0) {
        console.log(`Duplicate SMS detected (SID: ${messageSid}), skipping`);
        return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
      }
    }

    // --- Opt-out handling ---
    const optOutKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
    const optInKeywords = ['START', 'UNSTOP', 'YES'];
    const upperText = inboundText.toUpperCase();

    if (optOutKeywords.includes(upperText)) {
      const existing = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.SMSOptOut.create({
          phone_number: callerPhone,
          opted_out_at: new Date().toISOString(),
          opt_out_keyword: upperText,
          business_phone: toPhone,
        });
      }
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    if (optInKeywords.includes(upperText)) {
      // Handle explicit SMS consent for CA/NY
      const consents = await base44.asServiceRole.entities.LeadConsent.filter({ phone_number: callerPhone });
      if (consents.length > 0) {
        await base44.asServiceRole.entities.LeadConsent.update(consents[0].id, {
          explicit_sms_consent: true,
          explicit_consent_at: new Date().toISOString(),
        });
        console.log(`CA/NY explicit consent confirmed for ${callerPhone}`);
      }
      // Remove from opt-out list to re-enable SMS
      const existing = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
      for (const record of existing) {
        await base44.asServiceRole.entities.SMSOptOut.delete(record.id);
      }
      // Continue to process conversation normally (fall through)
    }

    // --- Rate limiting: 5 SMS/hour per phone ---
    const rateLimitCheck = checkSMSRateLimit(callerPhone);
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for ${callerPhone}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Check if opted out ---
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number: callerPhone });
    if (optOuts.length > 0) {
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- COMPLIANCE: Validate before responding to lead ---
    const complianceCheck = await base44.asServiceRole.functions.invoke(
      'validateComplianceBeforeAnyContact',
      {
        phone_number: callerPhone,
        contact_type: 'sms',
      }
    );

    if (!complianceCheck.data?.can_contact) {
      console.log(
        `SMS reply blocked for ${callerPhone}: ${complianceCheck.data?.reason}`
      );
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    const consents = await base44.asServiceRole.entities.LeadConsent.filter({
      phone_number: callerPhone,
      is_valid: true,
    });
    if (consents.length === 0) {
      console.log(`No valid consent for ${callerPhone}, skipping response`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Load the correct business profile by the "To" number (multi-tenant isolation) ---
    const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({ phone_number: toPhone });
    const profile = profiles[0];

    if (!profile || !profile.auto_response_enabled) {
      console.log(`No active profile found for number ${toPhone}`);
      return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // --- Find existing conversation for this caller + business number ---
    // Filter by caller_phone AND ensure the conversation belongs to this business's profile owner
    const allConversations = await base44.asServiceRole.entities.Conversation.filter({ caller_phone: callerPhone });
    // Match conversations that were created by this profile's owner (multi-tenant safe)
    const ownerConversations = allConversations.filter(c => c.created_by === profile.created_by);
    const conversation = ownerConversations.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

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

    // TCPA: Every message should include business identity and opt-out mechanism
    const stopLine = 'Reply STOP to opt out.';
    
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
- Do NOT use excessive emojis.
- TCPA REQUIREMENT: Always include "${stopLine}" at the end of your message. This is required for every SMS outbound.

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

The lead just sent: "${inboundText}"

Write the SMS reply text only. No quotes, no labels.`;

    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    let replyText = typeof aiResult === 'string' ? aiResult.trim() : String(aiResult).trim();

    // Ensure STOP line is present (CRITICAL for TCPA compliance)
    if (!replyText.includes('STOP')) {
      replyText += '\n' + stopLine;
    }

    // Validate message length (SMS: max 1600 chars)
    if (replyText.length > 1600) {
      console.warn(`SMS too long for ${callerPhone}: ${replyText.length} chars`);
      replyText = replyText.substring(0, 1597) + '...';
    }

    // --- Send SMS via Twilio, replying FROM the business's own number ---
    const client = twilio(accountSid, authToken);

    let smsStatus = 'sent';
    try {
      const msg = await client.messages.create({
        body: replyText,
        from: toPhone, // Reply from the number the lead texted
        to: callerPhone,
      });
      // Verify send was successful
      if (!msg.sid) {
        smsStatus = 'failed';
        console.error(`Failed to get Twilio SID for ${callerPhone}`);
      }
    } catch (twilioError) {
      smsStatus = 'failed';
      console.error(`Twilio send error for ${callerPhone}:`, twilioError.message);
    }

    // --- Update conversation record ---
    const now = new Date().toISOString();
    const newMessages = [...(conversation?.messages || [])];

    newMessages.push({ sender: 'lead', content: inboundText, timestamp: now });
    newMessages.push({ sender: 'ai', content: replyText, timestamp: now, sms_status: smsStatus });

    if (conversation) {
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        messages: newMessages,
        last_message_at: now,
        last_inbound_at: now,
        status: conversation.status === 'unresponsive' ? 'active' : conversation.status,
      });
    } else {
      // Create new conversation
      await base44.asServiceRole.entities.Conversation.create({
        caller_phone: callerPhone,
        messages: newMessages,
        last_message_at: now,
        last_inbound_at: now,
        status: 'active',
        pipeline_stage: 'new',
      });
    }

    // Log audit trail
    await base44.asServiceRole.functions.invoke('logSMSAudit', {
      phone_number: callerPhone,
      business_phone: toPhone,
      message_body: replyText,
      message_type: 'auto_response',
      status: smsStatus,
      consent_type: 'called_business',
      sent_by: 'ai',
    }).catch(e => console.error('Audit log failed:', e.message));

    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  } catch (error) {
    console.error('inboundSMS error:', error);
    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  }
});