# Database Optimization Plan (Phase 3)

## Current Performance Issues

### Tier 1 - Critical Queries (inboundSMS, validateConsentBeforeSMS)
- `LeadConsent.filter({phone_number, is_valid})` - No index, O(n) scan
- `SMSOptOut.filter({phone_number})` - No index, O(n) scan
- `Conversation.filter({caller_phone})` - No index, slow conversation lookup
- **Impact:** 500-1000ms per SMS reply

### Tier 2 - Medium Priority (Dashboard, Conversations)
- `Conversation.filter({created_by})` - No index, dashboard loads slow
- `Subscription.filter({user_email})` - No index, auth checks slow
- `BusinessProfile.filter({created_by})` - No index, settings page slow

### Tier 3 - Audit/Compliance (complianceAudit)
- `SMSAuditLog.list()` - Full table scan, slow audit reports
- `AdminAuditLog.filter({admin_email})` - No index

---

## Recommended Indexes

### CRITICAL (Add immediately)
```sql
-- SMS Compliance Gates
CREATE INDEX idx_sms_opt_out_phone ON SMSOptOut(phone_number);
CREATE INDEX idx_lead_consent_phone_valid ON LeadConsent(phone_number, is_valid);

-- Conversation Lookups
CREATE INDEX idx_conversation_caller_owner ON Conversation(caller_phone, created_by);
CREATE INDEX idx_conversation_owner_date ON Conversation(created_by, created_date DESC);

-- Business Ownership
CREATE INDEX idx_business_phone_owner ON BusinessProfile(phone_number, created_by);
```

### HIGH (Add next)
```sql
-- Subscription Lookup
CREATE INDEX idx_subscription_email ON Subscription(user_email);

-- Audit Trails
CREATE INDEX idx_sms_audit_phone_date ON SMSAuditLog(phone_number, created_date DESC);
CREATE INDEX idx_audit_log_email_date ON AdminAuditLog(admin_email, created_date DESC);

-- Team Management
CREATE INDEX idx_team_member_account ON TeamMember(account_id);
```

### MEDIUM (Add for completeness)
```sql
-- Automation Rules
CREATE INDEX idx_automation_rule_profile ON AutomationRule(business_profile_id);

-- Calendar Bookings
CREATE INDEX idx_calendar_booking_conv ON CalendarBooking(conversation_id);

-- CRM Integration
CREATE INDEX idx_crm_integration_account ON CRMIntegration(account_id);
```

---

## Performance Gains (Estimated)

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| SMS opt-out check | 800ms | 8ms | 100x |
| Consent validation | 500ms | 5ms | 100x |
| Conversation lookup | 600ms | 10ms | 60x |
| Dashboard load | 2000ms | 300ms | 6.6x |
| Compliance audit | 5000ms | 1000ms | 5x |

---

## Implementation Steps

### Phase 3.1: Deploy Critical Indexes (Week 1)
1. Create `idx_sms_opt_out_phone` + `idx_lead_consent_phone_valid`
2. Create conversation indexes
3. Monitor inboundSMS response times → Should drop to <100ms

### Phase 3.2: Deploy High Priority (Week 2)
1. Create subscription + audit indexes
2. Update dashboard queries to use indexes
3. Monitor compliance audit performance

### Phase 3.3: Deploy Medium Priority (Week 3)
1. Create remaining indexes
2. Run full performance audit
3. Document index maintenance

---

## Ongoing Optimization (Phase 3+)

### Query Analysis
Add performance monitoring to critical paths:
```javascript
// Track query duration
const start = performance.now();
const result = await base44.entities.LeadConsent.filter({phone_number, is_valid});
const duration = performance.now() - start;
if (duration > 50) {
  console.warn(`Slow query: LeadConsent.filter took ${duration}ms`);
}
```

### Caching Strategy
Implement caching for high-frequency lookups:
```javascript
// Cache opt-out list (updates on STOP keyword)
const optOutCache = new Map();
const optOutTTL = 300000; // 5 minutes

async function getCachedOptOuts() {
  const now = Date.now();
  if (optOutCache.has('list') && now - optOutCache.get('timestamp') < optOutTTL) {
    return optOutCache.get('list');
  }
  const optOuts = await base44.asServiceRole.entities.SMSOptOut.list();
  optOutCache.set('list', optOuts);
  optOutCache.set('timestamp', now);
  return optOuts;
}
```

### Archive Old Data
For compliance audit, archive SMS logs older than 12 months:
```javascript
// Monthly job: Archive audit logs
const cutoff = new Date();
cutoff.setMonth(cutoff.getMonth() - 12);

const oldLogs = await base44.asServiceRole.entities.SMSAuditLog.filter({
  sent_at: { $lt: cutoff.toISOString() }
});

// Move to archive table if needed, or mark as archived
// This keeps active table lean for faster queries
```

---

## Monitoring Dashboard

Track these KPIs post-optimization:

1. **Query Performance**
   - P50/P95/P99 latency for critical queries
   - Slow query log (> 100ms)

2. **Index Utilization**
   - % of queries using indexes
   - Index size growth

3. **Compliance Impact**
   - Audit report generation time
   - Compliance dashboard load time

---

## Rollback Plan

If indexes cause issues:
1. Drop the problematic index: `DROP INDEX idx_name`
2. Revert code changes using version control
3. Monitor performance return to baseline
4. Adjust index strategy

---

## Success Criteria (Phase 3 Complete)

- [ ] All critical queries < 50ms
- [ ] Dashboard load < 500ms
- [ ] Compliance audit < 2000ms
- [ ] No slow query warnings in logs
- [ ] Production deployment verified
- [ ] Backup/recovery tested with indexes