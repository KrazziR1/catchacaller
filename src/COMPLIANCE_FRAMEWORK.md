# CatchACaller Compliance Framework

**Last Updated:** 2026-04-25  
**Status:** Production-Ready

## Overview

This document outlines the TCPA (Telephone Consumer Protection Act), GDPR, and state-specific SMS compliance framework implemented across the platform.

## Compliance Architecture

### 1. Consent Management (LeadConsent Entity)

**Consent Types:**
- `called_business` - Established Business Relationship (90-day window from missed call)
- Explicit SMS consent - Required for CA/NY (caller replies "YES")

**Validation Lifecycle:**
```
Missed Call → Caller Phone Captured → LeadConsent Created (90-day EBR)
↓
SMS Sent ← validateConsentBeforeSMS checks:
  ✓ Consent exists
  ✓ EBR not expired
  ✓ Opted out? STOP
  ✓ State-specific (CA/NY explicit SMS consent)
```

**EBR Expiration:**
- 90 days from `called_at`
- After expiration, ZERO contact allowed
- Compliance audit warns at 7 days remaining

### 2. SMS Sending Pipeline

**All SMS must pass 3 gates:**

#### Gate 1: `validateConsentBeforeSMS`
- Checks if number is opted out
- Checks if valid consent exists
- Checks EBR not expired
- Checks state-specific consent (CA/NY)
- Returns: `{ can_send: boolean, reason: string }`

#### Gate 2: `validateSMSBeforeSend`
- Validates message includes TCPA STOP line
- Checks for high-risk industry compliance
- Checks EBR days remaining
- Warns on message length/segments
- Returns: `{ can_send: boolean, errors: [], warnings: [] }`

#### Gate 3: `logSMSAudit`
- Creates immutable audit trail
- Records sender, timestamp, message body
- References consent type for evidence
- Appends to SMSAuditLog (never deleted)

**Calling Pattern (Example: autoFollowUp):**
```javascript
for (const conv of conversations) {
  // Gate 1: Check consent
  const consentCheck = await base44.functions.invoke('validateConsentBeforeSMS', {
    phone_number: conv.caller_phone,
  });
  if (!consentCheck.data?.can_send) continue;

  // Gate 2: Check message compliance
  const smsCheck = await base44.functions.invoke('validateSMSBeforeSend', {
    phone_number: conv.caller_phone,
    message_body: smsBody,
    message_type: 'follow_up',
  });
  if (!smsCheck.data?.can_send) continue;

  // Send via Twilio
  await client.messages.create({ body, from, to });

  // Gate 3: Log audit
  await base44.functions.invoke('logSMSAudit', {
    phone_number: conv.caller_phone,
    message_body: body,
    message_type: 'follow_up',
    status: 'sent',
  });
}
```

### 3. Opt-Out Management (SMSOptOut Entity)

**Triggering Keywords:**
- STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT

**Processing (inboundSMS):**
1. Check if message is opt-out keyword (case-insensitive)
2. Create SMSOptOut record
3. Block ALL future SMS to that number
4. Return empty response (no receipt needed)

**Opt-In Keywords:**
- YES, START, UNSTOP (re-enable after opt-out)
- Sets `explicit_sms_consent: true` for CA/NY compliance

**Audit Trail:**
- Every opt-out/opt-in logged with timestamp
- Immutable (never deleted)
- Proof of TCPA compliance

### 4. State-Specific Compliance

#### California (CA)
- Requires explicit opt-in consent AFTER marketing contact
- Process: Missed call → SMS sent → Lead replies "YES" → Explicit consent granted
- `explicit_sms_consent: true` flag required before further contact

#### New York (NY)
- Same as CA
- `explicit_sms_consent: true` required

#### Other States
- EBR (Established Business Relationship) sufficient
- No explicit opt-in required

### 5. Account Activation Controls

**validateAccountForActivation** checks:

| Check | Severity | Action |
|-------|----------|--------|
| Terms accepted | BLOCKER | Cannot activate |
| SMS consent acknowledged | BLOCKER | Cannot activate |
| High-risk industry flag | BLOCKER | Manual review required |
| Phone number provisioned | WARNING | Auto-responses disabled |
| Booking URL configured | WARNING | Reduced conversion |
| Previous rejections | BLOCKER | Flag for review |

### 6. Compliance Auditing

**complianceAudit** function (admin-only):
- Scans all SMS in lookback period
- Detects violations:
  - SMS sent to opted-out numbers
  - SMS without STOP line
  - SMS without valid consent
  - SMS after EBR expired
- Returns: `{ stats: {}, issues: [], recommendations: [] }`

**ComplianceDashboard** (admin page):
- Real-time KPI: SMS sent, compliance rate, issues found
- Tabs: Issues, EBR Status, Opt-Outs, Audit Log, Recommendations
- Actionable alerts for critical violations
- Export compliance report

### 7. Multi-Tenant Isolation

**Conversation Ownership:**
```javascript
const ownerConversations = allConversations.filter(c => c.created_by === profile.created_by);
```

**Profile Matching by Twilio Number:**
```javascript
const profile = allProfiles.find(p => normalizePhone(p.phone_number) === toPhone);
```

**Prevents:** Data leakage between customers, unauthorized SMS sending

### 8. Immutable Audit Trails

**Cannot be deleted or modified:**
- SMSAuditLog entries
- SMSOptOut records
- LeadConsent records (is_valid flag only)
- AdminAuditLog entries (account approvals/rejections)

**Purpose:** Prove good-faith TCPA compliance in regulatory disputes

## Production Checklist

- [x] Consent validation on all SMS sends
- [x] EBR expiration checking (90-day window)
- [x] State-specific consent (CA/NY explicit opt-in)
- [x] Opt-out list (STOP keyword) with real-time checking
- [x] TCPA STOP line in all outbound messages
- [x] Immutable audit trail (SMSAuditLog)
- [x] Compliance audit reporting
- [x] Admin dashboard for compliance monitoring
- [x] Pre-activation account validation
- [x] Multi-tenant data isolation
- [x] High-risk industry flagging (debt collection, political)
- [x] Terms acceptance tracking
- [x] SMS consent acknowledgment tracking

## Testing Scenarios

### Scenario 1: Valid EBR Flow
1. Lead calls business (MissedCall created)
2. Platform creates LeadConsent with 90-day EBR
3. SMS sent → validateConsentBeforeSMS ✓
4. Audit logged
5. Result: ✓ Compliant

### Scenario 2: EBR Expired
1. LeadConsent.ebs_expiration_date < now
2. SMS attempt → validateConsentBeforeSMS ✗ (reason: ebr_expired)
3. SMS not sent
4. Result: ✓ Compliant (blocked illegal contact)

### Scenario 3: STOP Keyword
1. Lead texts "STOP"
2. inboundSMS processes keyword
3. SMSOptOut record created
4. Future SMS attempts → validateConsentBeforeSMS ✗ (reason: opted_out)
5. Result: ✓ Compliant

### Scenario 4: CA/NY Explicit Consent
1. Lead in CA calls
2. LeadConsent created with explicit_sms_consent: false
3. SMS sent → needs explicit consent check
4. Platform sends opt-in confirmation
5. Lead replies "YES"
6. inboundSMS sets explicit_sms_consent: true
7. Further SMS allowed
8. Result: ✓ Compliant

### Scenario 5: High-Risk Industry
1. Business registered as "Debt Collection"
2. checkComplianceKeywords sets is_high_risk_industry: true
3. Account requires manual review
4. Admin must approve before activation
5. Terms acceptance mandatory
6. Result: ✓ Gated properly

## Monitoring & Alerts

**Critical KPIs:**
- SMS compliance rate (target: 100%)
- Opt-out volume (monitor trends)
- EBR expiration pipeline (warn at 7 days)
- Failed SMS (investigate delivery issues)
- Missing STOP line (audit failures)

**Alerts:**
- SMS sent to opted-out number → CRITICAL
- SMS without consent → CRITICAL
- SMS after EBR expired → CRITICAL
- Missing STOP line → HIGH
- EBR expires in 7 days → MEDIUM

## Regulatory References

- **TCPA (47 USC § 227):** Telephone Consumer Protection Act
  - Requires prior expressed written consent for SMS marketing
  - STOP mechanism required
  - Do-Not-Call registry integration (planned)

- **GDPR:** General Data Protection Regulation
  - Explicit consent required (EU)
  - Right to be forgotten (implement data deletion)
  - Not currently enforced (US-focused)

- **State Laws:**
  - CA: Cal. Bus. & Prof. Code § 17602
  - NY: General Business Law § 527-b
  - Both require explicit opt-in for SMS marketing

## Future Enhancements

- [ ] Federal Do-Not-Call registry integration
- [ ] Real-time TCPA litigation risk scoring
- [ ] Automatic EBR renewal workflows
- [ ] GDPR data deletion ("right to be forgotten")
- [ ] SMS content filtering (block promotional language without consent)
- [ ] A2P (Application-to-Person) carrier compliance
- [ ] Message content validation against TCPA templates
- [ ] Geo-location compliance (state detection from area code)

## Support & Questions

For compliance questions, contact: **compliance@catchacaller.ai**

---

**Disclaimer:** This framework is designed to support TCPA compliance, but does not guarantee legal compliance. Consult legal counsel for your specific jurisdiction.