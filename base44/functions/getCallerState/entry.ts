import twilio from 'npm:twilio';

// Get caller's state via Twilio PhoneNumber lookup API
Deno.serve(async (req) => {
  try {
    const { phone_number } = await req.json();

    if (!phone_number) {
      return Response.json({ error: 'phone_number required' }, { status: 400 });
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});