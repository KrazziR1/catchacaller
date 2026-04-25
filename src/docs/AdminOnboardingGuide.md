# Admin Onboarding Guide for New Businesses

## Overview
CatchACaller's phone-first model routes incoming calls to the business owner's personal cell phone. If the owner doesn't answer, AI seamlessly takes over to qualify the lead. This guide walks admins through setting up each new business account.

---

## Pre-Setup Checklist

Before onboarding a new business, confirm:
- [ ] Business has a Twilio account (or we provision via API)
- [ ] Owner has provided their personal cell phone number (E.164 format: +1XXXXXXXXXX)
- [ ] Business profile exists in the database
- [ ] Subscription is active or trial is set up
- [ ] Compliance review completed (if high-risk industry)

---

## Step 1: Business Profile Configuration

### 1.1 Verify Core Information
In `BusinessProfile` entity, confirm these fields are populated:
- **business_name** - Legal business name
- **industry** - Selected from enum (hvac, plumbing, roofing, etc.)
- **phone_number** - Twilio number (E.164 format: +1XXXXXXXXXX)
- **owner_phone_number** - Owner's personal cell (E.164 format: +1XXXXXXXXXX) ⭐ **CRITICAL**
- **twilio_number_sid** - Twilio phone number SID (needed for API calls)
- **timezone** - Business timezone (defaults to America/New_York)

### 1.2 Verify Optional but Important Fields
- **booking_url** - Calendly or booking link (for SMS follow-ups)
- **website** - Business website
- **business_hours** - Description (e.g., "Mon-Fri 9am-5pm EST")
- **ai_personality** - "professional" or "friendly" (default: friendly)
- **average_job_value** - For ROI calculations (default: $500)
- **email_notifications_enabled** - Should be true to alert owner of missed calls
- **terms_accepted_at** - Timestamp of ToS acceptance
- **terms_version** - Version agreed to (e.g., "2026-04-25")

---

## Step 2: Twilio Phone Number Setup

### 2.1 Provision a Twilio Number (If Not Already Done)

**Option A: Via Admin Dashboard (Manual)**
1. Go to Twilio Console → Phone Numbers → Buy a Number
2. Select country (US), area code, search for available numbers
3. Verify the SID is recorded in `BusinessProfile.twilio_number_sid`

**Option B: Via API (Automated)**
Run the `provisionPhoneNumber` function:
```
POST /api/functions/provisionPhoneNumber
{
  "business_id": "profile-id",
  "area_code": "212",  // Optional: NYC example
  "country": "US"
}
```

### 2.2 Configure Twilio Voice Webhook

This is **CRITICAL** — it tells Twilio where to route incoming calls.

**In Twilio Console:**
1. Go to Phone Numbers → Manage → Active Numbers
2. Select the business's number
3. Under "Voice & Fax" section:
   - Set **Incoming calls** to: `Webhook`
   - URL: `https://your-app.com/api/functions/incomingCallHandler`
   - HTTP Method: `POST`
   - Save

This webhook (`incomingCallHandler` function) does the magic:
- Receives incoming call
- Looks up business profile
- Attempts to dial owner's phone via `<Dial>` TwiML command
- If owner doesn't pick up → triggers AI fallback

### 2.3 Configure Twilio SMS Webhook (For Inbound SMS)

1. Same phone number configuration page
2. Under "Messaging" section:
   - Set **Incoming messages** to: `Webhook`
   - URL: `https://your-app.com/api/functions/inboundSMS`
   - HTTP Method: `POST`
   - Save

This allows customers to reply to auto-SMS messages, and AI can respond.

---

## Step 3: Test the Phone Routing

### 3.1 Basic Call Test
1. Call the business's Twilio number from your phone
2. **Owner picks up?** → Call should ring through to their cell (owner_phone_number)
3. **Owner doesn't pick up?** → AI should answer with a greeting

### 3.2 Owner Busy/No Answer Test
1. Owner sets their cell to "Do Not Disturb" or doesn't pick up
2. Call should ring 2-3 times on owner's phone, then timeout
3. AI should answer: "Hi, this is [business_name]..."
4. Say: "I need to book an appointment"
5. AI should respond with a follow-up question and eventually offer booking link

### 3.3 Verify SMS Auto-Response
After a missed call:
1. Check that an auto-SMS was sent to the caller within 30 seconds
2. Message should include business name, CTA, and opt-out language (TCPA compliant)
3. Verify SMS appears in `SMSAuditLog` entity

---

## Step 4: Compliance & Consent Setup

### 4.1 Create LeadConsent Record
When the first call comes in, the webhook auto-creates:
- **LeadConsent** record with:
  - `phone_number` - Caller's E.164 number
  - `called_at` - Timestamp of call
  - `consent_type` - "called_business" (established business relationship)
  - `caller_state` - Detected via Twilio Lookup API
  - `ebs_expiration_date` - 90 days from call (TCPA safe harbor)
  - `explicit_sms_consent` - false (unless in CA/NY and confirmed later)

### 4.2 State-Specific Compliance

**CA & NY:** Require explicit SMS consent (not just EBR)
- After first call, SMS sent asking: "Reply YES to receive updates, STOP to opt out"
- Caller must reply "YES" before business SMS can be sent
- This is handled automatically in `missedCallWebhook` function

**Other States:** EBR (Established Business Relationship) sufficient
- Call = implicit consent for follow-up SMS for 90 days

### 4.3 Verify DNC Checking
Before ANY SMS is sent:
1. Check `SMSOptOut` entity for phone number
2. If found, skip SMS (respect opt-out)
3. Log the skip in audit

---

## Step 5: Subscription & Trial Setup

### 5.1 Set Up Trial Subscription
In `Subscription` entity, create:
- **user_email** - Business owner email
- **stripe_customer_id** - From Stripe (if paid tier)
- **stripe_subscription_id** - From Stripe
- **status** - "active" or "trialing"
- **plan_name** - "Starter" ($49), "Growth" ($149), or "Pro" ($297)
- **trial_end_date** - 7 days from start (e.g., April 25 → May 2)
- **current_period_end** - End of billing cycle

### 5.2 Charge Provisioning Fee (If Required)
Some setups charge $2.99 for Twilio activation:
- Charge via Stripe
- Store `stripe_provisioning_charge_id` in BusinessProfile
- Log in audit trail

---

## Step 6: Templates & AI Personality Setup

### 6.1 Load Industry Templates
Run the `seedIndustryTemplates` function or manually create SMS templates:

**Initial Response Template** (auto-sent after missed call):
```
Hi [caller_name]! We're [business_name]. Sorry we missed your call — we'd love to help! What can we do for you?

Book here: [booking_url]
Reply STOP to opt out.
```

**Follow-Up Template** (24 hours after no response):
```
Hey [caller_name], just following up on your call to [business_name]. Still interested? 

Book here: [booking_url]
```

### 6.2 Set AI Personality
In BusinessProfile, choose:
- **"friendly"** - Casual tone, emojis, conversational
- **"professional"** - Formal, business-like, no slang

---

## Step 7: Email Notifications Setup

### 7.1 Enable Owner Notifications
In BusinessProfile:
- **email_notifications_enabled** - Set to `true`

Owner will receive emails when:
- New missed call comes in (with auto-SMS confirmation)
- Conversation reaches "qualified" stage
- Lead books an appointment

### 7.2 Configure TCPA Disclaimer
Verify Terms of Service acceptance:
- **terms_accepted_at** - Timestamp when owner agreed
- **terms_version** - E.g., "2026-04-25"
- **consent_acknowledged_at** - When owner acknowledged SMS compliance

---

## Step 8: Webhook Monitoring & Debugging

### 8.1 Monitor Call Webhook Logs
Track `missedCallWebhook` function executions:
- Check for errors in execution logs
- Verify MissedCall records are created
- Confirm SMS audit entries exist

### 8.2 Monitor SMS Delivery
In `SMSAuditLog`, check:
- **status** - "sent", "delivered", or "failed"
- **twilio_message_sid** - Unique ID for debugging in Twilio
- **opted_out** - False (should be false initially)
- **sent_at** - Timestamp

### 8.3 Test Webhook Directly (Advanced)
If debugging needed, manually trigger:
```
POST /api/functions/missedCallWebhook
{
  "CallStatus": "no-answer",
  "From": "+1 (555) 123-4567",
  "To": "+1 (555) 987-6543",
  "CallerName": "John Doe"
}
```

---

## Step 9: Go-Live Checklist

Before marking business as "ready":
- [ ] **Owner phone number** verified and working
- [ ] **Twilio number** provisioned and SID stored
- [ ] **Voice webhook** configured and tested (owner can receive calls)
- [ ] **SMS webhook** configured for inbound replies
- [ ] **First test call** completed (AI answered when owner didn't pick up)
- [ ] **Auto-SMS** received within 30 seconds of missed call
- [ ] **Compliance setup** completed (LeadConsent created, state rules checked)
- [ ] **Templates** loaded (industry-specific SMS ready)
- [ ] **Email notifications** enabled
- [ ] **Subscription** active (trial or paid)
- [ ] **Owner trained** on dashboard (view conversations, send SMS, etc.)

---

## Common Issues & Solutions

### Issue: Calls Go Straight to Voicemail
**Cause:** Owner's phone number not configured or incorrect format
**Fix:**
1. Verify `owner_phone_number` in BusinessProfile is E.164 format (+1XXXXXXXXXX)
2. Test calling the number manually from another phone
3. Check Twilio Console → Phone Numbers → Logs for call routing errors

### Issue: AI Doesn't Answer (No Call Routes to AI)
**Cause:** Voice webhook not configured or Twilio SID is wrong
**Fix:**
1. Go to Twilio Console → Phone Numbers → Select number
2. Verify "Incoming calls" webhook URL is exactly: `https://your-app.com/api/functions/incomingCallHandler`
3. Test webhook in Twilio Console → API Explorer
4. Check `incomingCallHandler` function logs for errors

### Issue: SMS Not Sent After Missed Call
**Cause:** Compliance check failed, opt-out detected, or SMS webhook misconfigured
**Fix:**
1. Check `SMSOptOut` entity (is caller phone number there?)
2. Run `validateComplianceBeforeAnyContact` function manually to debug
3. Verify SMS webhook configured on Twilio
4. Check function logs in `logSMSAudit`

### Issue: CA/NY Caller Not Getting Opt-In Request
**Cause:** State detection failed or compliance check bypassed
**Fix:**
1. Run `getCallerState` function with test phone number
2. Verify Twilio Lookup API is enabled in account
3. Check `LeadConsent.caller_state` in database (should be "CA" or "NY")
4. Review `missedCallWebhook` logs for compliance block messages

### Issue: Owner Gets Too Many (or No) Email Notifications
**Cause:** Email notification settings not configured correctly
**Fix:**
1. Check `BusinessProfile.email_notifications_enabled` (should be true)
2. Verify owner's email in `User` entity matches `created_by` in BusinessProfile
3. Test `sendEmailNotification` function manually
4. Check email delivery logs

---

## Ongoing Admin Tasks

### Weekly
- Check admin dashboard for new signups
- Review any businesses stuck in onboarding
- Monitor webhook logs for errors
- Check for high DNC/opt-out rates (indicates bad targeting)

### Monthly
- Review compliance audit logs
- Analyze call-to-SMS-to-booking funnel metrics
- Identify businesses needing support

### Quarterly
- Audit Twilio charges (ensure no wasted credits)
- Review and update SMS templates based on performance
- Assess compliance framework against regulatory changes

---

## Admin Dashboard Access

**For This Business:**
1. Navigate to `/admin` (admin users only)
2. Search for business by name
3. Click to view details modal:
   - Overview: Business info, subscription, created date
   - Usage: Calls, SMS sent, conversations
   - Compliance: DNC records, consent logs
   - Team: Members with access

**Quick Actions:**
- Resend onboarding confirmation email
- View detailed conversation logs
- Export call data

---

## Contact & Escalation

If issues persist:
1. Check function logs: Deno Deploy Console
2. Review database entities directly
3. Contact Twilio support (include Twilio Number SID)
4. Escalate to product team with full function logs