import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Helper function: Validates if SMS can be sent to a phone number
// Returns: { can_send: boolean, reason?: string }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone_number } = await req.json();

    if (!phone_number) {
      return Response.json({ error: 'phone_number required' }, { status: 400 });
    }

    // 1. Check if opted out
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({
      phone_number,
    });
    if (optOuts.length > 0) {
      return Response.json({
        can_send: false,
        reason: 'opted_out',
      });
    }

    // 2. Check if consent exists and is valid
    const consents = await base44.asServiceRole.entities.LeadConsent.filter({
      phone_number,
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});