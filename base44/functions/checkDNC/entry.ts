import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Normalize any phone format to E.164 (+1XXXXXXXXXX)
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

// Simple DNC check — can be extended with API integration
// For now: checks our own opt-out list
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
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

    // Check if number is in our opt-out list
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({
      phone_number,
    });

    const isDNC = optOuts.length > 0;

    console.info(`DNC check: ${phone_number} - is_dnc: ${isDNC}`);
    return Response.json({
      phone_number,
      is_dnc: isDNC,
      reason: isDNC ? 'Number has opted out' : null,
    });
  } catch (error) {
    console.error(`DNC check error for phone:`, error.message);
    return Response.json({ error: 'DNC check failed' }, { status: 500 });
  }
});