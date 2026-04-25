// Pre-flight compliance check for ANY outbound SMS or email
// CRITICAL: All outbound contact (SMS, email, calls) must use this before sending
// Returns: { can_contact: boolean, reason: string, details: object }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { phone_number, contact_type, caller_state } = payload;
    // contact_type: 'sms' | 'email' | 'call'

    if (!phone_number || typeof phone_number !== 'string') {
      return Response.json({ error: 'Invalid phone_number' }, { status: 400 });
    }
    if (!contact_type || !['sms', 'email', 'call'].includes(contact_type)) {
      return Response.json({ error: 'Invalid contact_type' }, { status: 400 });
    }

    // 1. UNIVERSAL: Check for global opt-out (STOP)
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({
      phone_number,
    });
    if (optOuts.length > 0) {
      return Response.json({
        can_contact: false,
        reason: 'opted_out_globally',
        details: {
          opted_out_at: optOuts[0].opted_out_at,
          opt_out_keyword: optOuts[0].opt_out_keyword,
        },
      });
    }

    // 2. UNIVERSAL: Check if valid consent exists
    const consents = await base44.asServiceRole.entities.LeadConsent.filter({
      phone_number,
      is_valid: true,
    });
    if (consents.length === 0) {
      return Response.json({
        can_contact: false,
        reason: 'no_consent_record',
        details: { message: 'No established business relationship found' },
      });
    }

    const consent = consents[0];

    // 3. UNIVERSAL: Check EBR expiration (90-day window)
    const ebsExp = new Date(consent.ebs_expiration_date);
    const now = new Date();
    if (now > ebsExp) {
      return Response.json({
        can_contact: false,
        reason: 'ebr_expired',
        details: {
          expired_at: consent.ebs_expiration_date,
          days_expired: Math.floor((now - ebsExp) / (1000 * 60 * 60 * 24)),
        },
      });
    }

    // 4. STATE-SPECIFIC: Check strict state requirements (CA, NY, etc.)
    const strictStates = ['CA', 'NY'];
    const state = caller_state || consent.caller_state;
    
    if (strictStates.includes(state)) {
      // For CA/NY: SMS requires explicit YES consent AFTER the opt-in confirmation was sent
      if (contact_type === 'sms' && !consent.explicit_sms_consent) {
        return Response.json({
          can_contact: false,
          reason: 'explicit_consent_required',
          details: {
            state,
            message: `${state} requires explicit SMS opt-in (reply YES)`,
          },
        });
      }
    }

    // 5. DNC LOOKUP: Check national DNC registry (non-critical, log if fails)
    let isDnc = false;
    try {
      const dncCheck = await base44.asServiceRole.functions.invoke('checkDNC', {
        phone_number,
      });
      isDnc = dncCheck.data?.is_dnc || false;
    } catch (e) {
      console.warn('DNC lookup failed (non-critical):', e.message);
    }

    if (isDnc) {
      return Response.json({
        can_contact: false,
        reason: 'on_dnc_registry',
        details: { message: 'Number is registered on Do Not Call list' },
      });
    }

    // 6. PASS: All checks passed
    return Response.json({
      can_contact: true,
      reason: 'compliant',
      details: {
        consent_type: consent.consent_type,
        explicit_sms_consent: consent.explicit_sms_consent,
        ebr_expires_at: consent.ebs_expiration_date,
        state: state || 'UNKNOWN',
        days_remaining: Math.ceil((ebsExp - now) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (error) {
    console.error('validateComplianceBeforeAnyContact error:', error.message);
    // On error, default to FAIL (safer than permitting) - don't expose error details
    return Response.json({
      can_contact: false,
      reason: 'validation_error',
    }, { status: 500 });
  }
});