# Integration Test Suite (Phase 3)

**Purpose:** Validate end-to-end SMS workflows before production
**Duration:** 2-3 hours manual testing
**Status:** Ready to execute

---

## Test Environment Setup

**Prerequisites:**
- [ ] Staging business profile created
- [ ] Test Twilio number provisioned
- [ ] Test lead phone numbers ready (personal devices)
- [ ] Database in clean state
- [ ] All Phase 2 functions deployed to staging

**Test Data:**
```javascript
Business Profile:
- business_name: "Test HVAC"
- industry: "hvac"
- phone_number: +1234567890 (Twilio staging number)
- ai_personality: "friendly"
- booking_url: "https://calendly.com/test"
- timezone: "America/New_York"
- average_job_value: 500
- terms_accepted_at: [today]
- consent_acknowledged_at: [today]

Lead Phone Numbers:
- Regular state: +14155555001 (TX)
- CA state: +14155555002 (CA)
- NY state: +14155555003 (NY)
- DNC list: +14155555004
```

---

## TEST SUITE 1: Missed Call → Auto-SMS Flow

**Objective:** Verify end-to-end missed call detection and SMS response

### Setup
1. Create staging BusinessProfile (see above)
2. Provision test Twilio number
3. Clear SMSAuditLog, Conversation, LeadConsent, MissedCall records

### Test Sequence
```
STEP 1: Simulate missed call
  → Call provisioned Twilio number from +14155555001 (TX)
  → Let it ring 3 times, hang up (trigger "no-answer")
  → Verify webhooks received by missedCallWebhook function

STEP 2: Verify database records created
  → Check MissedCall: created with caller_phone, call_time, status='sms_sent'
  → Check LeadConsent: created with is_valid=true, ebs_expiration_date in 90 days
  → Check Conversation: created with status='active', messages array with AI SMS
  → Check SMSAuditLog: created with message_type='auto_response', status='sent'

STEP 3: Verify SMS delivery
  → Check phone received SMS within 2 seconds
  → Verify message includes booking link
  → Verify message includes "Reply STOP to opt out"
  → Verify message personality matches (friendly/professional)

STEP 4: Verify email notification
  → Check profile owner received email notification
  → Email includes caller phone, business name, response time
  → Email includes link to conversation dashboard

STEP 5: Measure response time
  → Log missedCallWebhook execution time
  → Target: < 2 seconds from call to SMS sent
  → Check function logs for performance metrics

STEP 6: Cleanup
  → Delete test records
  → Note any issues in test log
```

### Expected Results
```
✅ MissedCall record: created, status='sms_sent', response_time_seconds < 2
✅ LeadConsent record: created, is_valid=true
✅ Conversation record: created, status='active', 1 AI message in array
✅ SMSAuditLog record: created, twilio_message_sid set
✅ Lead device: SMS received with business name, booking link, STOP instruction
✅ Email: Sent to profile owner with correct data
✅ Function logs: No errors, clean execution
```

---

## TEST SUITE 2: Opt-Out (STOP) Flow

**Objective:** Verify opt-out processing and SMS blocking

### Setup
1. Use existing Conversation from TEST SUITE 1
2. Verify SMSOptOut table is empty

### Test Sequence
```
STEP 1: Send initial SMS
  → Call test Twilio number again from same lead phone
  → Verify auto-SMS sent to lead
  → Note: Lead may not respond immediately, wait up to 1 minute

STEP 2: Lead replies STOP
  → Lead texts "STOP" to business number
  → Verify inboundSMS webhook triggered
  → Check SMSOptOut record created immediately
  → Verify phone_number, opted_out_at, opt_out_keyword='STOP'

STEP 3: Attempt to send follow-up
  → Manually call sendTemplatedSMS or trigger autoFollowUp for same lead
  → Verify SMS is blocked at validateConsentBeforeSMS check
  → Verify reason='opted_out_globally'
  → Verify NO SMS sent, NO SMSAuditLog entry created

STEP 4: Lead replies START (unstop)
  → Lead texts "START" to business number
  → Verify inboundSMS webhook detects opt-in keyword
  → Verify SMSOptOut record DELETED
  → Verify explicit_sms_consent set to true if in CA/NY

STEP 5: Attempt to send SMS again
  → Trigger sendTemplatedSMS for same lead
  → Verify SMS is now allowed
  → Verify SMS sent, SMSAuditLog created

STEP 6: Cleanup
  → Delete SMSOptOut record
  → Note any issues
```

### Expected Results
```
✅ STOP processing: SMSOptOut created, lead phone stored
✅ Send block: validateConsentBeforeSMS returns can_send=false
✅ No SMS sent: SMSAuditLog not created for blocked attempt
✅ START processing: SMSOptOut deleted, explicit_sms_consent=true (if CA/NY)
✅ Unblock works: SMS sent successfully after START
✅ Consent state: LeadConsent.explicit_sms_consent reflects state
```

---

## TEST SUITE 3: State Compliance (CA/NY)

**Objective:** Verify strict state explicit consent flow

### Setup
1. Create separate test conversation for CA lead
2. Clear LeadConsent and Conversation records
3. Prepare CA phone number test

### Test Sequence
```
STEP 1: Missed call from CA
  → Call test Twilio number from +14155555002 (CA)
  → Let ring, hang up
  → Verify getCallerState returns state='CA'

STEP 2: Verify opt-in confirmation sent (NOT business message)
  → Check lead phone receives SMS
  → Verify message is opt-in request: "Reply YES to receive updates, STOP to opt out"
  → Verify message does NOT include business details or booking link
  → Verify leadConsent.explicit_sms_consent=false at this point

STEP 3: Lead replies YES
  → Lead texts "YES" to business number
  → Verify inboundSMS detects YES keyword
  → Verify LeadConsent.explicit_sms_consent set to true
  → Verify LeadConsent.explicit_consent_at timestamp set

STEP 4: Business message sent
  → Verify next SMS/follow-up sends business message
  → Message includes booking link and STOP instruction
  → Verify SMSAuditLog shows message was sent

STEP 5: Attempt to send before YES response
  → In separate test, call from CA without waiting for YES
  → Try to send SMS before explicit_sms_consent=true
  → Verify validateComplianceBeforeAnyContact blocks it
  → Verify reason='explicit_consent_required'

STEP 6: Cleanup
  → Delete test records for CA lead
```

### Expected Results
```
✅ State detection: getCallerState returns 'CA'
✅ Opt-in first: First SMS is opt-in confirmation (no business message)
✅ YES processing: explicit_sms_consent set to true, timestamp recorded
✅ Message sent: Business message sent after YES
✅ Block without consent: SMS blocked if no YES before business message
✅ Audit trail: All messages logged with consent type
```

---

## TEST SUITE 4: Team Assignment & Ownership

**Objective:** Verify auth checks and ownership validation

### Setup
1. Create 2 business profiles (User A, User B)
2. Create team members for User A profile
3. Create test conversations for User A

### Test Sequence
```
STEP 1: Valid assignment
  → User A calls assignConversation with valid team member
  → Verify assigned_to field updated
  → Verify assignment successful response

STEP 2: Invalid team member
  → User A tries to assign to email not in their team
  → Verify 404 error returned
  → Verify no assignment made

STEP 3: Cross-tenant attack attempt
  → User B tries to assign User A's conversation
  → Verify 403 Forbidden returned
  → Verify no assignment made

STEP 4: Check audit log
  → Verify AdminAuditLog or assignment log created
  → Log shows: timestamp, assignee email, conversation_id, user who made change

STEP 5: Bulk assignment
  → Create 5 conversations
  → Assign all to same team member
  → Verify all assigned correctly
  → Verify audit entries for each

STEP 6: Cleanup
  → Clear test assignments
```

### Expected Results
```
✅ Valid assign: assigned_to updated, success response
✅ Invalid member: 404 error, no assignment
✅ Cross-tenant blocked: 403 Forbidden, access denied
✅ Audit logging: Assignment tracked with user context
✅ Bulk works: All assignments processed
```

---

## TEST SUITE 5: Error Handling & Resilience

**Objective:** Verify graceful error handling across workflows

### Setup
1. Prepare test data
2. Set up monitoring for error logs

### Test Sequence
```
STEP 1: Invalid JSON payload
  → Send malformed JSON to function
  → Verify 400 Bad Request returned
  → Verify no stack trace exposed
  → Check error log for debugging info

STEP 2: Missing required field
  → Send valid JSON but missing required field
  → Verify 400 Bad Request with clear error message
  → Example: missing phone_number
  → Verify specific field mentioned in response

STEP 3: Unauthorized access
  → Call function without auth token
  → Verify 401 Unauthorized
  → Verify no data returned

STEP 4: Resource not found
  → Reference non-existent conversation_id
  → Verify 404 Not Found
  → Verify message indicates resource missing

STEP 5: Database connection failure
  → (Simulate in staging if possible)
  → Function should return 500
  → Verify safe error message returned
  → Verify function logs actual error for debugging

STEP 6: Twilio API failure
  → (Simulate by disconnecting staging from Twilio)
  → SMS send should fail gracefully
  → Verify error logged
  → Verify audit entry shows status='failed'
  → Verify next attempt can be retried

STEP 7: Batch operation partial failure
  → sendTemplatedSMS to 5 conversations
  → Simulate failure on conversation #3
  → Verify remaining 4 sent successfully
  → Verify results array shows individual statuses
  → Verify conversation #3 shows error reason

STEP 8: Cleanup
  → Clear test error records
```

### Expected Results
```
✅ Bad JSON: 400, no stack trace
✅ Missing field: 400, field name mentioned
✅ Unauthorized: 401, no data
✅ Not found: 404, resource type mentioned
✅ DB error: 500, safe message, logged error available
✅ Twilio failure: graceful handling, audit logged
✅ Partial failure: remaining items processed, results show individual status
```

---

## TEST SUITE 6: Compliance Audit

**Objective:** Verify compliance violations are detected

### Setup
1. Manually create test data violating compliance rules
2. Run complianceAudit function
3. Review results for expected violations

### Test Sequence
```
STEP 1: Create test violation data
  → Create SMSAuditLog with SMS to opted-out number
  → Create SMSAuditLog without STOP instruction
  → Create SMSAuditLog after EBR expired
  → Create SMSAuditLog without consent record

STEP 2: Run complianceAudit
  → Call complianceAudit function as admin
  → Set lookback_days=30
  → Verify audit completes without error

STEP 3: Verify violations detected
  → Check issues array contains:
    - SMS sent to opted-out number
    - SMS missing STOP keyword
    - SMS after EBR expiration
    - SMS without consent record
  → Verify each issue has: type, severity, message, phone

STEP 4: Verify recommendations generated
  → Check recommendations array
  → Verify recommendations suggest fixes for each violation
  → Verify priority levels set correctly

STEP 5: Non-admin access
  → Try to call complianceAudit as regular user
  → Verify 403 Forbidden returned
  → Verify no data leaked

STEP 6: Cleanup
  → Delete test violation records
```

### Expected Results
```
✅ Audit runs: No errors, results returned
✅ Violations detected: All test violations found
✅ Severity levels: Correct severity assigned (CRITICAL, HIGH, etc.)
✅ Recommendations: Generated with clear next steps
✅ Auth enforced: Non-admin rejected with 403
```

---

## Performance Validation Tests

### Metric 1: SMS Opt-Out Check Latency
```
Baseline (before indexes): 800-1000ms
Target (after indexes): < 10ms
Test:
  → Send 10 test SMSes from different numbers
  → Measure validateConsentBeforeSMS execution time
  → Record in logs
  → Verify < 50ms for 95% of calls
```

### Metric 2: Conversation Lookup Latency
```
Baseline: 600-800ms
Target: < 20ms
Test:
  → Create 100 test conversations
  → Query by caller_phone (indexed query)
  → Measure response time
  → Verify < 50ms
```

### Metric 3: Dashboard Load Time
```
Baseline: 2000-3000ms
Target: < 500ms
Test:
  → Open Conversations page in browser
  → Measure load time in DevTools
  → Verify < 500ms
  → Check Network tab for slow requests
```

### Metric 4: Compliance Audit Report Time
```
Baseline: 5000-8000ms
Target: < 2000ms
Test:
  → Run complianceAudit for 30-day lookback
  → Measure execution time
  → Verify < 2000ms
  → Check log for slow query warnings
```

---

## Test Execution Log Template

```
TEST SUITE: [Name]
Date: [Date]
Tester: [Name]
Status: [PASS / FAIL]

STEP-BY-STEP RESULTS:
Step 1: [Expected] ✅/❌
  Notes: [Any issues?]
Step 2: [Expected] ✅/❌
  Notes: [Any issues?]
...

ISSUES FOUND:
- [Issue 1]: [Description] [Severity]
- [Issue 2]: [Description] [Severity]

PERFORMANCE METRICS:
- Response time: [ms]
- Errors: [count]
- Success rate: [%]

APPROVAL: [APPROVED / NEEDS FIXES]
```

---

## Automated Test Checklist

After each test suite, verify:

- [ ] All expected database records created
- [ ] No unexpected errors in function logs
- [ ] Timestamps accurate (within system time)
- [ ] Audit logs contain all required fields
- [ ] Email notifications sent (if applicable)
- [ ] No stack traces in client responses
- [ ] Rate limiting working (if applicable)
- [ ] Multi-tenant isolation maintained

---

## Sign-Off

All test suites must pass with zero CRITICAL issues before production deployment.

**Test Lead Sign-Off:** ________________ Date: _______
**Tech Lead Review:** ________________ Date: _______