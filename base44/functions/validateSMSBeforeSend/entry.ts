import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CRITICAL: Pre-flight validation for ALL SMS sends
// This is a gatekeeper function that MUST be called before every Twilio API call
// Returns: { can_send: boolean, errors: [], warnings: [] }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone_number, message_body, message_type = 'manual' } = await req.json();

    if (!phone_number || !message_body) {
      return Response.json({ error: 'Missing phone_number or message_body' }, { status: 400 });
    }

    const errors = [];
    const warnings = [];

    // 1. CRITICAL: Check if opted out
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({ phone_number });
    if (optOuts.length > 0) {
      errors.push('Number has opted out (STOP received)');
    }

    // 2. CRITICAL: Validate consent exists and is valid
    const consents = await base44.asServiceRole.entities.LeadConsent.filter({
      phone_number,
      is_valid: true,
    });

    if (consents.length === 0) {
      errors.push('No valid consent record found');
    } else {
      const consent = consents[0];

      // 3. CRITICAL: Check EBR expiration (90-day window)
      const ebsExp = new Date(consent.ebs_expiration_date);
      const now = new Date();
      if (now > ebsExp) {
        errors.push(`EBR expired on ${ebsExp.toLocaleDateString()}`);
      } else {
        const daysRemaining = Math.ceil((ebsExp - now) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 7) {
          warnings.push(`EBR expires in ${daysRemaining} days`);
        }
      }

      // 4. STATE-SPECIFIC: Strict state requirements (CA, NY)
      const strictStates = ['CA', 'NY'];
      if (strictStates.includes(consent.caller_state)) {
        if (!consent.explicit_sms_consent) {
          errors.push(`${consent.caller_state} requires explicit SMS opt-in consent`);
        }
      }
    }

    // 5. CONTENT: Check message includes TCPA-required STOP line
    const stopLineExists = message_body.toUpperCase().includes('STOP');
    if (!stopLineExists) {
      // Auto-append STOP line if missing (for compliance)
      warnings.push('Message missing TCPA STOP line — will be auto-appended');
    }

    // 6. CONTENT: Check message length for SMS
    if (message_body.length > 160) {
      warnings.push(`Message is ${Math.ceil(message_body.length / 160)} SMS segments (longer costs more)`);
    }

    // 7. BUSINESS RISK: Check if this is a high-risk industry account
    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 100);
    const profile = profiles[0]; // Most recent profile
    if (profile && profile.is_high_risk_industry && !profile.terms_accepted_at) {
      errors.push('High-risk industry account: Terms not accepted');
    }

    const canSend = errors.length === 0;

    return Response.json({
      can_send: canSend,
      errors,
      warnings,
      message_info: {
        type: message_type,
        length: message_body.length,
        segments: Math.ceil(message_body.length / 160),
      },
      recommendation: canSend ? 'SMS can be sent' : `Cannot send: ${errors.join('; ')}`,
    });
  } catch (error) {
    console.error('validateSMSBeforeSend error:', error);
    return Response.json({
      can_send: false,
      errors: ['Validation service error: ' + error.message],
      warnings: [],
    }, { status: 500 });
  }
});