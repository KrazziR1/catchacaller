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
    const { caller_state, phone_number } = await req.json();

    if (!caller_state || !phone_number) {
      return Response.json(
        { error: 'caller_state and phone_number required' },
        { status: 400 }
      );
    }

    const stateCode = caller_state.toUpperCase();
    const rules = STATE_RULES[stateCode] || STATE_RULES.DEFAULT;

    // Check if valid consent exists for stricter states
    let has_valid_consent = true;
    if (rules.requires_explicit_consent) {
      const consents = await base44.asServiceRole.entities.LeadConsent.filter({
        phone_number,
        is_valid: true,
      });
      has_valid_consent = consents.length > 0;
    }

    const is_compliant = !rules.requires_explicit_consent || has_valid_consent;

    return Response.json({
      state: stateCode,
      state_name: rules.name || stateCode,
      is_compliant,
      requires_explicit_consent: rules.requires_explicit_consent,
      restrictions: rules.restrictions,
      has_valid_consent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});