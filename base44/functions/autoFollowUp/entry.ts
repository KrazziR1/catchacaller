import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

// Runs on a schedule — checks for conversations with no reply in ~24hrs and sends a single follow-up SMS
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    const client = twilio(accountSid, authToken);

    // Load business profile
    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];
    if (!profile || !profile.auto_response_enabled) {
      return Response.json({ skipped: 'No profile or auto-response disabled' });
    }

    // Load opt-out list
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.list('-created_date', 1000);
    const optOutNumbers = new Set(optOuts.map(o => o.phone_number));

    // Find conversations that:
    // - are still "active" (not booked, lost, unresponsive, manual_takeover)
    // - have received exactly 0 follow-ups
    // - last message was sent >22hrs ago (some buffer) and <26hrs ago (so we don't double-send if automation fires early/late)
    const now = Date.now();
    const windowStart = now - 26 * 60 * 60 * 1000; // 26 hours ago
    const windowEnd   = now - 22 * 60 * 60 * 1000; // 22 hours ago

    const conversations = await base44.asServiceRole.entities.Conversation.list('-created_date', 500);

    const toFollowUp = conversations.filter(c => {
      if (c.status !== 'active') return false;
      if ((c.follow_up_count || 0) >= 1) return false; // already sent a follow-up
      if (optOutNumbers.has(c.caller_phone)) return false;

      // Use last_message_at if available, else created_date
      const lastActivity = new Date(c.last_message_at || c.created_date).getTime();
      return lastActivity >= windowStart && lastActivity <= windowEnd;
    });

    console.log(`Found ${toFollowUp.length} conversations eligible for 24hr follow-up`);

    const results = [];

    for (const conv of toFollowUp) {
      const callerName = conv.caller_name || 'there';
      const bookingLine = profile.booking_url
        ? ` Book here: ${profile.booking_url}`
        : '';

      const body = profile.ai_personality === 'professional'
        ? `Hi ${callerName}, just following up on your missed call to ${profile.business_name}. We'd love to help — what can we assist you with?${bookingLine} Reply STOP to opt out.`
        : `Hey ${callerName}! 👋 Just checking in — you called ${profile.business_name} yesterday and we don't want you to miss out. Still need help?${bookingLine} Reply STOP to opt out.`;

      await client.messages.create({ body, from: fromPhone, to: conv.caller_phone });

      // Record message in conversation
      const messages = conv.messages || [];
      messages.push({
        sender: 'ai',
        content: body,
        timestamp: new Date().toISOString(),
        sms_status: 'sent',
      });

      await base44.asServiceRole.entities.Conversation.update(conv.id, {
        messages,
        follow_up_count: (conv.follow_up_count || 0) + 1,
        last_message_at: new Date().toISOString(),
      });

      results.push({ conversation_id: conv.id, phone: conv.caller_phone, status: 'sent' });
      console.log(`✓ Follow-up sent to ${conv.caller_phone}`);
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    console.error('autoFollowUp error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});