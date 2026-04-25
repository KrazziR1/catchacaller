import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import twilio from 'npm:twilio';

// Normalize any phone format to E.164
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

// Scheduled function — iterates over ALL active business profiles and sends follow-ups
// for their own conversations only (multi-tenant safe)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const client = twilio(accountSid, authToken);

    // Load opt-out list once
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.list('-created_date', 1000);
    const optOutNumbers = new Set(optOuts.map(o => o.phone_number));

    // Load all business profiles with auto-response enabled
    const allProfiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 500);
    const activeProfiles = allProfiles.filter(p => p.auto_response_enabled && p.phone_number);

    const now = Date.now();
    const windowStart = now - 26 * 60 * 60 * 1000; // 26 hours ago
    const windowEnd   = now - 22 * 60 * 60 * 1000; // 22 hours ago

    // Load all conversations once
    const allConversations = await base44.asServiceRole.entities.Conversation.list('-created_date', 2000);

    let totalSent = 0;
    const results = [];

    for (const profile of activeProfiles) {
      const fromPhone = normalizePhone(profile.phone_number);
      if (!fromPhone) continue;

      // Only process conversations belonging to this profile's owner
      const profileConversations = allConversations.filter(c => c.created_by === profile.created_by);

      let toFollowUp = profileConversations.filter(c => {
        if (c.status !== 'active') return false;
        if ((c.follow_up_count || 0) >= 1) return false;
        if (optOutNumbers.has(c.caller_phone)) return false;
        const lastActivity = new Date(c.last_message_at || c.created_date).getTime();
        return lastActivity >= windowStart && lastActivity <= windowEnd;
      });

      // Filter by valid consent for each conversation
      const consentValidConvs = [];
      for (const conv of toFollowUp) {
        const consentCheck = await base44.asServiceRole.functions.invoke('validateConsentBeforeSMS', {
          phone_number: conv.caller_phone,
        });
        if (consentCheck.data?.can_send) {
          consentValidConvs.push(conv);
        } else {
          results.push({
            conversation_id: conv.id,
            phone: conv.caller_phone,
            business: profile.business_name,
            status: 'skipped',
            reason: consentCheck.data?.reason || 'consent_invalid',
          });
        }
      }

      toFollowUp = consentValidConvs;

      console.log(`Profile ${profile.business_name}: ${toFollowUp.length} conversations eligible for follow-up`);

      for (const conv of toFollowUp) {
         try {
           const callerName = conv.caller_name || 'there';
           const bookingLine = profile.booking_url ? ` Book here: ${profile.booking_url}` : '';

           const body = profile.ai_personality === 'professional'
             ? `Hi ${callerName}, just following up on your missed call to ${profile.business_name}. We'd love to help — what can we assist you with?${bookingLine} Reply STOP to opt out.`
             : `Hey ${callerName}! 👋 Just checking in — you called ${profile.business_name} yesterday and we don't want you to miss out. Still need help?${bookingLine} Reply STOP to opt out.`;

           const msg = await client.messages.create({ body, from: fromPhone, to: conv.caller_phone });

           const messages = [...(conv.messages || [])];
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

           // Log audit trail
           await base44.asServiceRole.functions.invoke('logSMSAudit', {
             phone_number: conv.caller_phone,
             business_phone: fromPhone,
             message_body: body,
             message_type: 'follow_up',
             conversation_id: conv.id,
             status: 'sent',
             twilio_message_sid: msg.sid,
             consent_type: 'called_business',
             sent_by: 'auto_followup',
           }).catch(e => console.warn('Audit log failed for follow-up:', e.message));

           results.push({ conversation_id: conv.id, phone: conv.caller_phone, business: profile.business_name, status: 'sent' });
           totalSent++;
           console.log(`✓ Follow-up sent to ${conv.caller_phone} for ${profile.business_name}`);
         } catch (err) {
           console.error(`Failed to send follow-up for ${conv.id}:`, err.message);
           results.push({ conversation_id: conv.id, phone: conv.caller_phone, business: profile.business_name, status: 'error', error: err.message });
         }
       }
    }

    console.info(`autoFollowUp processed ${activeProfiles.length} profiles, sent ${totalSent} follow-ups`);
    return Response.json({ processed: totalSent, results });
  } catch (error) {
    console.error(`autoFollowUp error:`, error.message);
    return Response.json({ error: 'Follow-up job failed' }, { status: 500 });
  }
});