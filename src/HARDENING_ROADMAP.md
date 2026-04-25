# Complete Hardening Roadmap (Phase 2-3+)

**Current Status:** Phase 1 ✅ Complete | Phase 2 🔄 In Progress | Phase 3 ⏳ Pending

---

## PHASE 2: Apply Helpers to All Functions

### Tier 1: Critical Functions (DONE)
✅ stripeWebhook - Fixed signature validation order, error handling  
✅ validateConsentBeforeSMS - Added phone validation, safe error handling  
✅ sendEmailNotification - Added auth checks, input sanitization, safe errors  

### Tier 2: High-Impact Functions (TODO)
**Functions that modify data or handle payments:**

- [ ] **provisionPhoneNumber** - Add auth ownership check, logger
- [ ] **sendTemplatedSMS** - Add auth ownership check, standardized responses
- [ ] **sendOnboardingConfirmation** - Add input validation, logger
- [ ] **createTrialSubscription** - Add email validation, logger
- [ ] **createCheckoutSession** - Add auth check, logger
- [ ] **manualSyncToCRM** - Add auth ownership check, logger
- [ ] **assignConversation** - Add auth check, logger, validate team member ownership
- [ ] **syncCalendarBooking** - Add auth check, logger
- [ ] **inboundSMS** - Already fixed, just add logger

**Pattern to Apply:**
```javascript
// 1. Validate request
const { phone_number, ... } = await req.json();
if (!phone_number) return badRequest();

// 2. Authenticate + authorize
const user = await base44.auth.me();
if (!user) return unauthorized();
if (user.role !== 'admin') return forbidden();

// 3. Check ownership
const profile = await authorizeProfileOwner(user.email);
if (!profile) return forbidden();

// 4. Validate input
if (!validatePhoneNumber(phone_number)) return badRequest();

// 5. Execute with logging
try {
  const result = await operation();
  logApiCall('operation', 'success', user.email);
  return success(result);
} catch (error) {
  logApiCall('operation', 'error', user.email, error.message);
  return serverError();
}
```

### Tier 3: Utility Functions (TODO)
Functions that fetch data or support operations:

- [ ] **validateComplianceBeforeAnyContact** - Add logger, structured responses
- [ ] **checkComplianceKeywords** - Add logger
- [ ] **validateStateCompliance** - Add logger
- [ ] **getCallerState** - Add logger
- [ ] **logSMSAudit** - Add safe error handling (critical for compliance)
- [ ] **complianceAudit** - Add auth (admin-only), logger
- [ ] **validateAccountForActivation** - Add auth (admin-only), logger
- [ ] **sendEmailViaProvider** - Add logger, delivery tracking
- [ ] **exportConversations** - Add auth check, logger

---

## PHASE 3: Database Optimization

### Add Indexes
```javascript
// Execute in database (or document for manual execution)
// Assuming base44 provides index creation API

// High-priority indexes (frequently filtered)
CREATE INDEX idx_sms_opt_out_phone ON SMSOptOut(phone_number);
CREATE INDEX idx_lead_consent_phone ON LeadConsent(phone_number, is_valid);
CREATE INDEX idx_conversation_caller ON Conversation(caller_phone, created_by);
CREATE INDEX idx_business_profile_phone ON BusinessProfile(phone_number, created_by);
CREATE INDEX idx_conversation_owner ON Conversation(created_by, created_date DESC);
CREATE INDEX idx_subscription_email ON Subscription(user_email);
CREATE INDEX idx_audit_admin ON AdminAuditLog(admin_email, created_date DESC);
CREATE INDEX idx_sms_audit_phone ON SMSAuditLog(phone_number, created_date DESC);

// Medium-priority indexes (used in frequent queries)
CREATE INDEX idx_team_member_account ON TeamMember(account_id);
CREATE INDEX idx_automation_rule_profile ON AutomationRule(business_profile_id);
CREATE INDEX idx_calendar_booking_conv ON CalendarBooking(conversation_id);
```

**Impact:**
- Conversation lookups: ~1000ms → ~10ms
- Consent checks: ~500ms → ~5ms
- Opt-out filtering: ~800ms → ~8ms

---

## PHASE 3+: Beyond Core Hardening

### Email Delivery Tracking
```javascript
// Track email open rates, bounces, delivery failures

// Add to sendEmailNotification:
const emailLogEntry = await base44.entities.EmailLog.create({
  user_email: user.email,
  recipient: emailData.to,
  subject: emailSubject,
  type: notificationType,
  status: 'sent',
  sent_at: new Date().toISOString(),
  opened_at: null,
  bounced_at: null,
});

// Update on bounce webhook (requires email provider integration)
// Update on open pixel (requires pixel tracking in emails)
```

### Integration Testing Suite
```javascript
// Test complete SMS workflows

// Test 1: Missed Call → Auto-Response → Audit Log
// 1. Trigger missedCallWebhook
// 2. Verify Conversation created
// 3. Verify auto-response sent
// 4. Verify SMSAuditLog entry
// 5. Verify LeadConsent checked

// Test 2: Opt-Out Flow
// 1. Lead sends "STOP"
// 2. Verify SMSOptOut created
// 3. Verify future SMS blocked
// 4. Lead sends "START"
// 5. Verify SMSOptOut deleted

// Test 3: Multi-Tenant Isolation
// 1. User A creates conversation with phone +15551234567
// 2. User B tries to query conversation
// 3. Verify access denied

// Test 4: Compliance Violations
// 1. Attempt SMS after EBR expiration
// 2. Verify SMS blocked
// 3. Verify audit log shows reason
```

### Performance Monitoring
```javascript
// Add to lib/logger.js:
class PerformanceMonitor {
  track(operationName, startTime, endTime, success, userId) {
    const duration = endTime - startTime;
    logMetric({
      operation: operationName,
      duration_ms: duration,
      success,
      user: userId,
      timestamp: new Date().toISOString()
    });
    
    // Alert if slow
    if (duration > 1000) {
      logWarn('SLOW_OPERATION', {
        operation: operationName,
        duration_ms: duration
      });
    }
  }
}

// Track in all critical functions:
const start = performance.now();
const result = await base44.entities.Conversation.list();
monitor.track('load_conversations', start, performance.now(), true, user.email);
```

### Rate Limiting Enhancements
```javascript
// Current: Simple in-memory limiter per operation
// Future: Add persistent rate limiting via Redis

// Implement sliding window + burst allowance:
const rateLimiter = {
  limits: {
    'provision_phone': { calls: 5, window: 3600, burst: 1 },
    'send_sms': { calls: 100, window: 3600, burst: 5 },
    'send_email': { calls: 50, window: 3600, burst: 2 },
  },
  
  check(key, operation) {
    const limit = this.limits[operation];
    const calls = this.getRecentCalls(key, limit.window);
    
    if (calls.length >= limit.calls) {
      return { allowed: false, retryAfter: this.resetTime(key) };
    }
    
    return { allowed: true, remaining: limit.calls - calls.length };
  }
};
```

### Admin Dashboard Enhancements
```javascript
// Current: Basic KPI display
// Future: Advanced monitoring

// Add to ComplianceDashboard:
- Real-time SMS delivery status tracking
- Compliance violation heatmap (by industry, state)
- Performance metrics (API latency, error rates)
- Rate limit monitoring
- User activity audit trail
- Failed operation replay/retry interface
```

---

## Function Hardening Checklist Template

Use this for each function in Tier 2/3:

```
Function: [NAME]
Location: functions/[name]
Status: [ ] TODO [ ] IN-PROGRESS [ ] DONE

Changes:
- [ ] Add input validation (validators.js)
- [ ] Add auth check (authHelpers.js)
- [ ] Add ownership validation if applicable
- [ ] Replace console.error with log.error
- [ ] Replace generic Response.json with apiResponse helpers
- [ ] Add try-catch with safe error responses
- [ ] Add audit logging if data mutation
- [ ] Test with invalid inputs
- [ ] Test with unauthorized user
- [ ] Verify error responses don't leak sensitive data

Validation:
- [ ] Lint passes
- [ ] No console.errors that reveal error details
- [ ] Response shapes consistent
- [ ] Audit trails created for mutations
```

---

## Testing Checklist (QA/Validation)

### Tier 1 Functions (Already Fixed)
- [x] stripeWebhook - Signature validation before base44 init
- [x] validateConsentBeforeSMS - Phone format validation, safe errors
- [x] sendEmailNotification - Auth check, input sanitization, safe responses

### Tier 2 Functions (TODO)
For each function in Tier 2, verify:
- [ ] Invalid input → 400 Bad Request (not 500)
- [ ] Unauthorized user → 401 Unauthorized
- [ ] Forbidden user → 403 Forbidden
- [ ] Database errors → 500 (no details leaked)
- [ ] Sensitive operations logged
- [ ] Response consistent with apiResponse helpers
- [ ] No console.error with sensitive data

### Tier 3 Functions (TODO)
Same checks as Tier 2, plus:
- [ ] Utility functions use logApiCall for monitoring
- [ ] Support functions handle null/undefined gracefully
- [ ] Chained errors properly propagated

### Integration Tests (TODO)
- [ ] SMS workflow end-to-end
- [ ] Opt-out flow
- [ ] Multi-tenant isolation
- [ ] Compliance block scenarios
- [ ] Database index performance

---

## Production Deployment Plan

1. **Pre-Deployment:**
   - [ ] All Tier 1 functions tested ✅
   - [ ] Tier 2 functions hardened & tested (TODO)
   - [ ] Database indexes created (TODO)
   - [ ] Monitoring alerts configured (TODO)

2. **Deployment:**
   - [ ] Deploy Phase 2 functions
   - [ ] Deploy database indexes
   - [ ] Enable monitoring
   - [ ] Monitor error rates for 24h

3. **Post-Deployment:**
   - [ ] Verify no new errors
   - [ ] Check performance improvements
   - [ ] Review logs for anomalies
   - [ ] Proceed to Phase 3+ enhancements

---

## Timeline Estimate

- Phase 2 Tier 1: ✅ Complete
- Phase 2 Tier 2: ~2-3 hours (10 functions)
- Phase 2 Tier 3: ~2-3 hours (8 functions)
- Phase 3 Database: ~30 minutes
- Phase 3+ Monitoring: ~2-3 hours
- Testing & Validation: ~4-5 hours

**Total Remaining:** ~11-15 hours (full hardening)