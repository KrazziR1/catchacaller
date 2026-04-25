# Security & Bugs Audit Report
**Date:** 2026-04-25

---

## 🔴 CRITICAL ISSUES

### 1. **Missing Error Handling in BulkSMSDialog**
- **Location:** `components/coldcalls/BulkSMSDialog.jsx:45-56`
- **Issue:** Promise.all() with no error recovery. If one SMS fails, entire operation fails silently.
- **Risk:** Users may not know which messages failed.
- **Fix:** Use Promise.allSettled() instead to track individual failures.

### 2. **Race Condition in Phone Validation**
- **Location:** `pages/Onboarding.jsx:151-155`
- **Issue:** DNC check happens async but doesn't prevent form submission if check is still pending.
- **Risk:** User could submit before DNC result arrives.
- **Fix:** Add `dncChecking` state to form validation.

### 3. **Missing Auth Check in CSV Export**
- **Location:** `functions/exportConversationsCSV.js:16-18`
- **Issue:** Function checks auth but doesn't verify subscription status.
- **Risk:** Trial-expired users can export data they shouldn't access.
- **Fix:** Add subscription status verification.

### 4. **Weak Phone Number Validation**
- **Location:** `functions/validatePhoneE164.js` and `functions/sendColdCallSMS.js`
- **Issue:** Regex `/^\+1\d{10}$/` allows test numbers like +15551234567.
- **Risk:** Can send to toll-free testing numbers (550-559).
- **Fix:** Add check: `phone_number.substring(2, 5) !== '555'`

### 5. **No Concurrency Limit on Bulk SMS**
- **Location:** `components/coldcalls/BulkSMSDialog.jsx:47`
- **Issue:** `Promise.all()` fires ALL SMS at once. Twilio rate limits could fail.
- **Risk:** Bulk operations crash without clear error.
- **Fix:** Implement batch processing (5-10 concurrent, rest queued).

---

## 🟠 HIGH-PRIORITY BUGS

### 6. **Lead Scoring Not Recalculated Dynamically**
- **Location:** `functions/calculateLeadScore.js`
- **Issue:** Score calculated once, not updated when metrics change.
- **Risk:** Dashboard shows stale scores.
- **Fix:** Add automation to recalculate on message/click events.

### 7. **A/B Test Results Never Increment**
- **Location:** `components/conversations/ABTestManager.jsx`
- **Issue:** `ab_test_results` initialized but never updated on send.
- **Risk:** A/B test metrics stay at zero.
- **Fix:** Update results in sendSMS function when variant sent.

### 8. **Conversation Subscription Memory Leak**
- **Location:** `components/conversations/ConversationDetail.jsx:23-30`
- **Issue:** Unsubscribe not called properly if component unmounts.
- **Risk:** Real-time listeners pile up, causing memory bloat.
- **Fix:** Ensure cleanup in dependency array.

### 9. **Missing Prospect Validation Before SMS Send**
- **Location:** `components/coldcalls/BulkSMSDialog.jsx:49-52`
- **Issue:** No check if prospect is DNC-flagged or opted out before sending.
- **Risk:** Compliance violations (sending to opted-out numbers).
- **Fix:** Filter prospects before bulk send.

### 10. **ConversationDetail Input Doesn't Handle Multi-line**
- **Location:** `components/conversations/ConversationDetail.jsx:166-172`
- **Issue:** Uses `Input` component (single-line) instead of `Textarea`.
- **Risk:** Users can't compose longer messages naturally.
- **Fix:** Change to `Textarea` component.

---

## 🟡 MEDIUM-PRIORITY ENHANCEMENTS

### 11. **No Duplicate Phone Detection**
- **Location:** Cold call prospecting
- **Issue:** Can add same phone number multiple times.
- **Fix:** Check for existing phone in `ColdCallProspect` before create.

### 12. **Missing Webhook Validation**
- **Location:** Inbound SMS/call handlers
- **Issue:** No signature verification for incoming webhooks.
- **Risk:** Spoofed webhook requests.
- **Fix:** Add Twilio webhook signature validation.

### 13. **Lead Score Algorithm Too Simple**
- **Location:** `functions/calculateLeadScore.js:18-32`
- **Issue:** Linear scoring ignores industry context, prospect recency, response patterns.
- **Risk:** HVAC "not interested" scored same as Legal "interested".
- **Fix:** Add industry-specific weighting, recency decay (newer = higher).

### 14. **No Timezone Awareness**
- **Location:** Business hours, scheduled SMS
- **Issue:** All times in UTC, no conversion to business timezone.
- **Risk:** Scheduled SMS sends at wrong time for customer.
- **Fix:** Use `business.timezone` to schedule relative to local time.

### 15. **Session Persistence Uses localStorage (Not Secure for Sensitive Data)**
- **Location:** `lib/AuthContext.jsx:13-24`
- **Issue:** User object cached in localStorage (readable by XSS).
- **Risk:** If XSS occurs, attacker can hijack sessions.
- **Fix:** Reduce what's cached (just email/role, not full object). Use sessionStorage for sensitive tokens.

---

## 🔵 LOW-PRIORITY / NICE-TO-HAVE

### 16. **Pagination Missing on Admin Dashboard**
- **Location:** `pages/Admin.jsx`
- **Issue:** Fetches 50 businesses but no way to see more.
- **Fix:** Add pagination or infinite scroll.

### 17. **No Bulk Rejection UI for High-Risk Accounts**
- **Location:** Admin panel
- **Issue:** Admins reject accounts one-by-one.
- **Fix:** Add bulk actions (approve/reject multiple).

### 18. **SMS Character Counter Missing Recommendations**
- **Location:** Template editor
- **Issue:** Shows character count but not segment count (SMS sent in 160-char segments).
- **Fix:** Show "3 SMS segments" for 380-char message.

### 19. **No Export Filtering**
- **Location:** `functions/exportConversationsCSV.js`
- **Issue:** Exports ALL conversations, no date range filter.
- **Fix:** Add optional startDate/endDate parameters.

### 20. **Lead Scoring Doesn't Account for Time Since Last Contact**
- **Location:** Lead score calculation
- **Issue:** 90-day-old "interested" prospect scored same as 1-day-old.
- **Fix:** Add recency decay: `score * (1 - daysSinceContact / 180)`.

---

## ✅ QUICK FIXES (< 10 min each)

```javascript
// Fix #4: Block 555 test numbers
const isTestNumber = /^\+1555/.test(phone_number);

// Fix #10: Change Input to Textarea
<Textarea
  value={reply}
  onChange={(e) => setReply(e.target.value)}
  placeholder="Type a message..."
  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddMessage()}
  className="rounded-xl text-sm"
/>

// Fix #11: Check for duplicates
const existing = await base44.entities.ColdCallProspect.filter({
  phone_number: form.phone_number
});
if (existing.length > 0) throw new Error('Phone already added');
```

---

## Recommendations (Priority Order)

1. **Implement Promise.allSettled() for bulk SMS** (prevents silent failures)
2. **Add DNC check before bulk send** (compliance critical)
3. **Block 555 test numbers in validation** (prevents test SMS)
4. **Fix conversation real-time subscription** (memory leak)
5. **Update A/B test results on send** (feature completeness)
6. **Add industry-weighted lead scoring** (accuracy improvement)
7. **Add timezone awareness** (user experience)