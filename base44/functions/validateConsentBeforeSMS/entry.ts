import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Validates if SMS can be sent to a phone number
// Returns: { can_send: boolean, reason?: string }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone_number } = await req.json();

    // Input validation
    if (!phone_number || typeof phone_number !== 'string') {
      return Response.json({ error: 'Invalid phone_number' }, { status: 400 });
    }

    const normalizedPhone = phone_number.trim();
    if (!/^\+?1?\d{10,}$/.test(normalizedPhone.replace(/\D/g, ''))) {
      return Response.json({ error: 'Invalid phone format' }, { status: 400 });
    }

    // 1. Check if opted out
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({
      phone_number: normalizedPhone,
    });
    if (optOuts.length > 0) {
      return Response.json({
        can_send: false,
        reason: 'opted_out',
      });
    }

    // 2. Check if consent exists and is valid
    const consents = await base44.asServiceRole.entities.LeadConsent.filter({
      phone_number: normalizedPhone,
      is_valid: true,
    });

    if (consents.length === 0) {
      return Response.json({
        can_send: false,
        reason: 'no_consent',
      });
    }

    const consent = consents[0];

    // 3. Check if EBR has expired
    const ebsExp = new Date(consent.ebs_expiration_date);
    const now = new Date();
    if (now > ebsExp) {
      return Response.json({
        can_send: false,
        reason: 'ebr_expired',
      });
    }

    // 4. For strict states, require explicit SMS consent
    const strictStates = ['CA', 'NY'];
    if (strictStates.includes(consent.caller_state)) {
      if (!consent.explicit_sms_consent) {
        return Response.json({
          can_send: false,
          reason: 'explicit_consent_required',
          state: consent.caller_state,
        });
      }
    }

    return Response.json({
      can_send: true,
      reason: 'valid_consent',
      consent_state: consent.caller_state,
      explicit_sms_consent: consent.explicit_sms_consent,
      ebr_expires_at: consent.ebs_expiration_date,
    });
  } catch (error) {
    console.error('validateConsentBeforeSMS error:', error.message);
    // Fail safely on errors - better to reject than allow
    return Response.json({ can_send: false, reason: 'validation_error' }, { status: 500 });
  }
});