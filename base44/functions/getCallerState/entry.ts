import twilio from 'npm:twilio';

// Normalize any phone format to E.164 (+1XXXXXXXXXX)
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

// Get caller's state via Twilio PhoneNumber lookup API
Deno.serve(async (req) => {
  try {
    const payload = await req.json().catch(() => ({}));
    const rawPhone = payload.phone_number;

    if (!rawPhone || typeof rawPhone !== 'string') {
      return Response.json({ error: 'Invalid phone_number' }, { status: 400 });
    }

    // Normalize phone to E.164 format
    const phone_number = normalizePhone(rawPhone);
    if (!phone_number) {
      return Response.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const client = twilio(accountSid, authToken);

    try {
      const phoneInfo = await client.lookups.v2.phoneNumbers(phone_number).fetch();
      const state = phoneInfo.address_details?.state_province_iso;

      return Response.json({
        phone_number,
        state: state?.toUpperCase() || 'UNKNOWN',
        city: phoneInfo.address_details?.locality || null,
        country: phoneInfo.country_code || 'US',
      });
    } catch (lookupErr) {
      // If lookup fails, return UNKNOWN but don't error
      console.warn('Phone lookup failed (non-critical):', lookupErr.message);
      return Response.json({
        phone_number,
        state: 'UNKNOWN',
        city: null,
        country: 'US',
      });
    }
  } catch (error) {
    console.error(`State lookup error for phone:`, error.message);
    return Response.json({ error: 'State lookup failed' }, { status: 500 });
  }
});