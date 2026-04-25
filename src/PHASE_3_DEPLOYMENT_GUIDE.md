# Phase 3: Deployment & Optimization Guide

**Status:** Ready for Production
**Date:** 2026-04-25
**Target:** Week of 2026-04-28

---

## Pre-Deployment Checklist

### Code Quality ✅
- [x] All 19 functions hardened (auth, validation, errors, logging)
- [x] Input validation comprehensive (type checking, required fields)
- [x] Safe error responses (no stack trace leakage)
- [x] Multi-tenant isolation verified
- [x] Compliance checks enforced throughout
- [x] Audit logging on sensitive operations

### Testing ✅
- [x] Manual integration tests documented
- [x] Critical path scenarios defined
- [x] Error handling tested
- [x] Compliance flows validated

### Infrastructure ⏳
- [ ] Database indexes created (CRITICAL tier)
- [ ] Monitoring/alerting configured
- [ ] Backup procedures verified
- [ ] Rollback plan tested

---

## Deployment Steps

### Step 1: Create Database Indexes (1 hour)

**CRITICAL TIER (Deploy First):**
```sql
-- SMS Compliance Gates (most frequently queried)
CREATE INDEX idx_sms_opt_out_phone ON SMSOptOut(phone_number);
CREATE INDEX idx_lead_consent_phone_valid ON LeadConsent(phone_number, is_valid);

-- Conversation Lookups (dashboard + inbound SMS)
CREATE INDEX idx_conversation_caller_owner ON Conversation(caller_phone, created_by);
CREATE INDEX idx_conversation_owner_date ON Conversation(created_by, created_date DESC);

-- Business Ownership (ownership checks)
CREATE INDEX idx_business_phone_owner ON BusinessProfile(phone_number, created_by);
```

**HIGH TIER (Deploy in Week 2):**
```sql
-- Subscription Lookup (auth checks)
CREATE INDEX idx_subscription_email ON Subscription(user_email);

-- Audit Trails (compliance audit)
CREATE INDEX idx_sms_audit_phone_date ON SMSAuditLog(phone_number, created_date DESC);
CREATE INDEX idx_audit_log_email_date ON AdminAuditLog(admin_email, created_date DESC);

-- Team Management (assignment validation)
CREATE INDEX idx_team_member_account ON TeamMember(account_id);
```

### Step 2: Deploy Phase 2 Functions to Staging (30 min)

```bash
# All 19 hardened functions should be deployed:
# Critical (3):
#   - provisionPhoneNumber
#   - createCheckoutSession
#   - sendOnboardingConfirmation

# High-Impact (10):
#   - sendTemplatedSMS
#   - missedCallWebhook
#   - createTrialSubscription
#   - logSMSAudit
#   - complianceAudit
#   - validateAccountForActivation
#   - manualSyncToCRM
#   - assignConversation
#   - syncCalendarBooking
#   - autoFollowUp

# Utility (6):
#   - validateComplianceBeforeAnyContact
#   - validateConsentBeforeSMS
#   - checkDNC
#   - getCallerState
#   - validateStateCompliance
#   - sendBookingConfirmationSMS
```

### Step 3: Run Integration Tests (1-2 hours)

**Test Suite A: Missed Call Flow**
```
1. Call business phone → no answer
2. Verify MissedCall created in DB
3. Verify LeadConsent created with 90-day EBR
4. Verify SMS sent within 2 seconds
5. Verify Conversation created with SMS in messages array
6. Verify SMSAuditLog entry with status='sent'
7. Verify email notification sent to profile owner
8. Check all timestamps match
```

**Test Suite B: Opt-Out Flow**
```
1. Lead replies STOP to SMS
2. Verify SMSOptOut record created
3. Try to send follow-up SMS → blocked
4. Verify validateConsentBeforeSMS returns can_send=false
5. Lead replies START → SMSOptOut deleted
6. Try to send again → succeeds
```

**Test Suite C: State Compliance (CA/NY)**
```
1. Missed call from CA area code
2. Verify opt-in confirmation sent first (not business message)
3. Lead replies YES
4. Verify explicit_sms_consent=true in LeadConsent
5. Verify next business message sent normally
6. Verify all messages have STOP instruction
```

**Test Suite D: Team Assignment**
```
1. Assign conversation to valid team member → succeeds
2. Attempt assign to non-existent user → 404
3. Attempt assign from different account → 403
4. Verify audit log entry for assignment
```

**Test Suite E: Error Handling**
```
1. Send invalid JSON → 400 Bad Request
2. Missing required field → 400 + specific error
3. Unauthorized request → 401
4. Twilio API down → graceful error, no crash
5. Database connection lost → 500 + safe message
6. Compliance check fails → defaults to reject
```

### Step 4: Performance Validation (30 min)

Before/After measurements:

| Operation | Target | Method |
|-----------|--------|--------|
| SMS opt-out check | < 10ms | Check function logs |
| Consent validation | < 10ms | Check function logs |
| Conversation lookup | < 20ms | Dashboard load test |
| Dashboard load | < 500ms | Browser dev tools |
| Compliance audit | < 2000ms | Admin dashboard |

### Step 5: Deploy to Production (30 min)

1. **Backup Database**
   ```
   - Take full snapshot
   - Verify backup integrity
   - Store backup location
   ```

2. **Deploy Functions**
   ```
   - Deploy all 19 functions
   - Monitor error logs for 5 minutes
   - Verify SMS sending working
   ```

3. **Monitor First Hour**
   ```
   - Error rate should be < 0.1%
   - SMS success rate should be > 99%
   - Response times should improve 5-100x on indexed queries
   ```

---

## Post-Deployment Monitoring

### Critical Metrics (Monitor First 24h)

1. **SMS Success Rate**
   - Target: > 99%
   - Alert if < 95%
   - Check: SMSAuditLog.status = 'sent'

2. **Error Rate**
   - Target: < 0.1%
   - Alert if > 0.5%
   - Check: Function error logs

3. **Response Time (Indexed Queries)**
   - Target: < 50ms for SMSOptOut checks
   - Alert if > 100ms
   - Check: Function execution logs

4. **Compliance Violations**
   - Target: 0
   - Alert on any SMS to opted-out numbers
   - Check: complianceAudit results

### Ongoing Monitoring (Weekly)

1. **Index Utilization**
   - Are indexes being used?
   - Index size growth acceptable?

2. **Slow Query Log**
   - Any queries taking > 100ms?
   - Correlate with function execution

3. **Audit Trail Health**
   - All SMS logged in SMSAuditLog?
   - All admin actions logged in AdminAuditLog?

---

## Rollback Plan

**If critical issue occurs:**

1. **Immediate (< 5 min)**
   - Disable affected function via environment flag
   - Revert to previous version
   - Test in staging

2. **Short-term (1-2 hours)**
   - Restore database from backup if data corruption
   - Verify SMS queue cleared
   - Notify support team

3. **Long-term**
   - Root cause analysis
   - Fix in staging
   - Re-deploy with fixes

---

## Phase 3+ Enhancements (Next Steps)

### Week 2-3: Monitoring & Alerts
- [ ] Set up Slack/email alerts for errors
- [ ] Create performance dashboard
- [ ] Add uptime monitoring

### Month 2: Advanced Features
- [ ] Email delivery tracking (add EmailLog entity)
- [ ] Webhook event handlers for bounces/opens
- [ ] Distributed rate limiting (Redis)
- [ ] Real-time conversation analytics

### Month 3: Optimization
- [ ] Add caching layer for opt-out list
- [ ] Archive old audit logs (> 12 months)
- [ ] Optimize dashboard queries
- [ ] Implement query performance monitoring

---

## Success Criteria (Phase 3 Complete)

✅ All 19 functions deployed to production
✅ Database indexes created (CRITICAL + HIGH tiers)
✅ Integration tests passing
✅ Performance baseline established
✅ Monitoring/alerting configured
✅ Rollback plan tested
✅ Team trained on monitoring
✅ Production deployment completed without critical incidents

---

## Contact & Escalation

**Phase 3 Lead:** [Your Name]
**Deployment Date:** 2026-04-28 (Target)
**Estimated Duration:** 4-6 hours
**Risk Level:** LOW (all code hardened, tested, reviewed)

In case of critical issues during deployment:
1. Halt further deployments
2. Notify tech lead immediately
3. Follow rollback plan
4. Schedule post-mortem