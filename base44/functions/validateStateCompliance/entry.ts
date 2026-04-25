import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// State-specific SMS compliance rules
const STATE_RULES = {
  CA: {
    name: 'California',
    requires_explicit_consent: true,
    restrictions: 'CCPA: Requires explicit written consent. Cannot send without prior express written consent.',
    links: 'https://oag.ca.gov/privacy/ccpa',
  },
  NY: {
    name: 'New York',
    requires_explicit_consent: true,
    restrictions: 'NY GBL 527: Requires prior express written consent for telemarketing SMS.',
    links: 'https://www.dos.ny.gov/consumer-protection',
  },
  TX: {
    name: 'Texas',
    requires_explicit_consent: false,
    restrictions: 'TCPA applies. Established business relationship generally sufficient.',
  },
  FL: {
    name: 'Florida',
    requires_explicit_consent: false,
    restrictions: 'TCPA applies. Standard federal rules.',
  },
  // Default for other states
  DEFAULT: {
    requires_explicit_consent: false,
    restrictions: 'TCPA applies. Established business relationship required.',
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { caller_state, phone_number } = payload;

    if (!caller_state || typeof caller_state !== 'string') {
      return Response.json({ error: 'Invalid caller_state' }, { status: 400 });
    }
    if (!phone_number || typeof phone_number !== 'string') {
      return Response.json({ error: 'Invalid phone_number' }, { status: 400 });
    }

    const stateCode = caller_state.toUpperCase();
    const rules = STATE_RULES[stateCode] || STATE_RULES.DEFAULT;

    // Check if valid consent exists for stricter states
    let has_valid_consent = false;
    let ebs_expired = false;

    const consents = await base44.asServiceRole.entities.LeadConsent.filter({
      phone_number,
      is_valid: true,
    });

    if (consents.length > 0) {
      const consent = consents[0];
      // Check if EBR has expired (90 days)
      const ebsExp = new Date(consent.ebs_expiration_date);
      const now = new Date();
      ebs_expired = now > ebsExp;

      // For strict states, also require explicit SMS consent
      if (rules.requires_explicit_consent) {
        has_valid_consent = consent.explicit_sms_consent && !ebs_expired;
      } else {
        has_valid_consent = !ebs_expired;
      }
    }

    const is_compliant = !rules.requires_explicit_consent ? !ebs_expired : has_valid_consent;

    console.info(`State compliance check: ${stateCode} - compliant: ${is_compliant}`);
    return Response.json({
      state: stateCode,
      state_name: rules.name || stateCode,
      is_compliant,
      requires_explicit_consent: rules.requires_explicit_consent,
      restrictions: rules.restrictions,
      has_valid_consent,
    });
  } catch (error) {
    console.error(`State compliance error for ${phone_number}:`, error.message);
    return Response.json({ error: 'Compliance check failed' }, { status: 500 });
  }
});