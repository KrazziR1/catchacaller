import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Normalize phone to E.164
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const toPhone = normalizePhone(params.get('To'));
    const fromPhone = normalizePhone(params.get('From'));
    const callerName = params.get('CallerName') || 'Unknown';

    console.log(`Incoming call: ${fromPhone} → ${toPhone}`);

    const base44 = createClientFromRequest(req);

    // Load business profile by Twilio number
    const allProfiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 500);
    const profile = allProfiles.find(p => normalizePhone(p.phone_number) === toPhone);

    if (!profile) {
      console.log(`No business profile found for ${toPhone}`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Sorry, we're unable to connect your call right now. Please try again later.</Say>
          <Hangup/>
        </Response>`;
      return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

    if (!profile.auto_response_enabled || !profile.owner_phone_number) {
      console.log(`Auto-response disabled or no owner phone for ${toPhone}`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Sorry, we're unable to connect your call right now. Please try again later.</Say>
          <Hangup/>
        </Response>`;
      return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

    // TwiML: Try to dial the owner's phone
    // If no-answer or busy, Twilio will webhook back and trigger the AI fallback
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial callerId="${toPhone}" timeout="20" action="/webhook/missed-call" method="POST">
          ${profile.owner_phone_number}
        </Dial>
      </Response>`;

    console.log(`Dialing owner ${profile.owner_phone_number} for incoming call from ${fromPhone}`);
    return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
  } catch (error) {
    console.error(`incomingCallHandler error:`, error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Sorry, we're unable to connect your call right now. Please try again later.</Say>
        <Hangup/>
      </Response>`;
    return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }
});