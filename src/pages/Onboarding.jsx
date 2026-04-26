import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Elements } from "@stripe/react-stripe-js";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PhoneCall, Building2, Bot, CalendarCheck,
  CheckCircle2, ArrowRight, ArrowLeft, Zap,
  CreditCard, MessageSquare, Loader2,
  AlertTriangle, Sparkles, Clock, TrendingUp, ShieldCheck
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PhoneProvision from "@/components/PhoneProvision";

const STRIPE_PUBLISHABLE_KEY = "pk_live_51TQ7e0FsxP0HXZ0AL4xFM0tGvmqLkCEPVCO4PVW5VrGxnbV2cKmHZpFXHNZTv6Y3mzGJCK6KRvFt2P3rEWL5I67n00dxEm3n3r";
const stripePromise = typeof window !== 'undefined' 
  ? window.Stripe(STRIPE_PUBLISHABLE_KEY) 
  : Promise.resolve(null);

const steps = [
  { key: "signup", icon: Building2, title: "Create Your Account", subtitle: "Your login for CatchACaller" },
  { key: "business", icon: Building2, title: "Your Business", subtitle: "Let's get your profile set up" },
  { key: "phone", icon: PhoneCall, title: "Phone Numbers", subtitle: "Your business line & personal cell for call forwarding" },
  { key: "ai", icon: Bot, title: "AI Personality", subtitle: "How should your AI respond to leads?" },
  { key: "booking", icon: CalendarCheck, title: "Booking Link", subtitle: "Critical — where should leads go to book?" },
  { key: "template", icon: MessageSquare, title: "Your First Message", subtitle: "Preview what leads will receive instantly" },
  { key: "launch", icon: Sparkles, title: "You're Live!", subtitle: "Here's what to expect in the next 24 hours" },
];

export default function Onboarding() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [profileId, setProfileId] = useState(null);
  const [smsComplianceAgreed, setSmsComplianceAgreed] = useState(false);
  const [hasTwilioAccount, setHasTwilioAccount] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    industry: "general",
    is_high_risk_industry: false,
    industry_description: "",
    phone_number: "",
    owner_phone_number: "",
    business_hours: "Mon-Fri 8am-6pm",
    ai_personality: "friendly",
    booking_url: "",
    auto_response_enabled: true,
    email_notifications_enabled: true,
  });

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [savingError, setSavingError] = useState(null);

  // On mount: check if user is already authenticated.
  // If yes, skip step 0 (signup) and go directly to step 1 (business info).
  // If admin, redirect to /admin. If they already have a profile, redirect to /dashboard.
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (isAuth) => {
      if (isAuth) {
        try {
          const user = await base44.auth.me();
          if (user?.role === 'admin') {
            navigate('/admin', { replace: true });
            return;
          }
          // Check if they already have a profile → send to dashboard
          const profiles = await base44.entities.BusinessProfile.list('-created_date', 1);
          if (profiles.length > 0) {
            navigate('/dashboard', { replace: true });
            return;
          }
          // Authenticated but no profile → skip to step 1 (business info)
          setCurrentStep(1);
          setAuthChecked(true);
        } catch {
          // Couldn't load user, stay on step 0
          setAuthChecked(true);
        }
      } else {
        setAuthChecked(true);
      }
    });
  }, [navigate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSavingError(null);
      // Re-check compliance at save time to ensure SMS agreement still checked
      if (!smsComplianceAgreed) {
        throw new Error("You must agree to SMS compliance to continue.");
      }
      
      // Check for compliance keywords if "other" industry
      if (form.industry === 'other') {
        try {
          const keywordCheck = await base44.functions.invoke('checkComplianceKeywords', {
            business_name: form.business_name,
            industry: form.industry,
          });
          if (keywordCheck.data?.requires_manual_review) {
            form.is_high_risk_industry = true;
          }
        } catch (e) {
          console.warn('Compliance check failed (non-critical):', e.message);
        }
      }

      const dataToSave = {
        ...form,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "2026-04-25",
        consent_acknowledged_at: smsComplianceAgreed ? new Date().toISOString() : null,
      };
      if (profileId) {
        return base44.entities.BusinessProfile.update(profileId, dataToSave);
      }
      return base44.entities.BusinessProfile.create(dataToSave);
    },
    onSuccess: async (data) => {
      if (!profileId) setProfileId(data.id);
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      // Fire background tasks without blocking — non-critical
      configureWebhooksIfNeeded().catch(err => console.error('Webhook config failed:', err));
      createTrialSubscription().catch(err => console.error('Trial creation failed:', err));
      sendConfirmationEmail(data).catch(err => console.error('Email failed:', err));
    },
    onError: (error) => {
      setSavingError(error.message || 'Failed to save profile. Please try again.');
      console.error("Save failed:", error);
    },
  });

  const [webhookConfigStatus, setWebhookConfigStatus] = useState("idle"); // idle | loading | done | error

  const createTrialSubscription = async () => {
    try {
      await base44.functions.invoke("createTrialSubscription", {});
    } catch (e) {
      console.error("Trial subscription creation failed (non-critical):", e);
    }
  };



  const isStepValid = () => {
    if (currentStep === 0) return !!signupEmail && signupPassword.length >= 8;
    if (currentStep === 1) return !!form.business_name && smsComplianceAgreed && (form.industry !== 'other' || !!form.industry_description);
    if (currentStep === 2) {
      // Owner's cell is REQUIRED
      if (!form.owner_phone_number) return false;
      const e164Regex = /^\+1\d{10}$/;
      if (!e164Regex.test(form.owner_phone_number)) return false;
      
      // Business phone REQUIRED (either Twilio or manual)
      if (!form.phone_number) return false;
      const isValidFormat = e164Regex.test(form.phone_number);
      const isTestNumber = /^\+1555/.test(form.phone_number);
      
      return isValidFormat && !isTestNumber;
    }
    if (currentStep === 4) {
      // Booking URL is optional - allow skip
      if (form.booking_url && form.booking_url.trim() !== '') {
        try {
          new URL(form.booking_url);
        } catch {
          return false;
        }
      }
      return true;
    }
    return true;
    };

  // After profile is saved, auto-configure webhooks if number was entered manually (not provisioned)
  const configureWebhooksIfNeeded = async () => {
    // Only configure if they entered manually (PhoneProvision already sets webhooks)
    // We attempt it and silently ignore errors — not critical to block progress
    setWebhookConfigStatus("loading");
    try {
      const res = await base44.functions.invoke("configureWebhooks", {});
      setWebhookConfigStatus(res.data?.success ? "done" : "error");
    } catch {
      setWebhookConfigStatus("error");
    }
  };

  const sendConfirmationEmail = async (profileData) => {
    try {
      await base44.functions.invoke("sendOnboardingConfirmation", {
        business_name: profileData.business_name || form.business_name,
        phone_number: profileData.phone_number || form.phone_number,
        booking_url: profileData.booking_url || form.booking_url,
      });
    } catch (e) {
      console.error("Confirmation email failed (non-critical):", e);
    }
  };

  const next = () => {
    if (currentStep === 0) {
      // Sign up
      handleSignup();
      return;
    }
    if (currentStep === 4) {
      saveMutation.mutate();
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  // Bug fix: testSmsMutation is defined but referenced variables (testPhone) were removed in earlier edit
  // Keeping unused mutation for now to avoid breaking reference errors

  const handleSignup = async () => {
    setIsSigningUp(true);
    setSignupError(null);
    try {
      if (!signupEmail || signupPassword.length < 8) {
        setSignupError("Please enter a valid email and a password with at least 8 characters.");
        setIsSigningUp(false);
        return;
      }
      // redirectToLogin navigates away — this won't return to this code path
      base44.auth.redirectToLogin("/onboarding", { signup: true });
    } catch (err) {
      setSignupError(err.message || "Signup failed. Try again.");
      setIsSigningUp(false);
    }
  };

  // Advance to next step after save completes
  useEffect(() => {
    if (saveMutation.isSuccess && currentStep === 4) {
      setCurrentStep(5);
    }
  }, [saveMutation.isSuccess, currentStep]);

  const back = () => setCurrentStep(currentStep - 1);



  const getPreviewMessage = () => {
    const name = form.business_name || "your business";
    const stopInstruction = " Reply STOP to opt out of future messages.";
    
    // For strict states (CA/NY), show the opt-in message first
    const isStrictState = true; // Show the stricter version for preview
    
    if (isStrictState) {
      return `Hi! This is ${name}. Reply YES to receive SMS updates about your service request, or STOP if you prefer not to receive messages.`;
    }
    
    if (form.ai_personality === "professional") {
      return `Thank you for contacting ${name}. We missed your call and would be happy to assist you. What can we help you with today?${stopInstruction}`;
    }
    return `Hi! 👋 Sorry we missed your call — we're ${name}. What can we help you with today?${stopInstruction}`;
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;

  // Show spinner while checking auth status on load
  if (!authChecked && currentStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <PhoneCall className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">CatchACaller</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 mb-10 flex-wrap">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentStep
                  ? "bg-accent text-accent-foreground"
                  : i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i < currentStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 transition-all ${i < currentStep ? "bg-accent" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            {/* Step header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-0.5">Step {currentStep + 1} of {steps.length}</p>
                <h2 className="text-xl font-bold">{step.title}</h2>
                <p className="text-sm text-muted-foreground">{step.subtitle}</p>
              </div>
            </div>

            {/* Error Alert */}
            {savingError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-destructive">Error</p>
                  <p className="text-xs text-destructive/80 mt-1">{savingError}</p>
                </div>
              </div>
            )}

            {/* Step content */}
            <div className="space-y-4">

              {/* STEP 0: Sign Up */}
              {currentStep === 0 && (
                <>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => { setSignupEmail(e.target.value); setSignupError(null); }}
                      placeholder="you@company.com"
                      className="mt-1.5 h-12 rounded-xl"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => { setSignupPassword(e.target.value); setSignupError(null); }}
                      placeholder="Create a strong password"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">At least 8 characters</p>
                  </div>
                  {signupError && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">Looks like you already have an account!</p>
                        <p className="text-xs text-blue-800 mt-1">
                          That email is already registered. Would you like to sign in instead?
                        </p>
                        <button
                          onClick={() => base44.auth.redirectToLogin("/onboarding")}
                          className="mt-2 text-xs font-semibold text-primary underline hover:opacity-80"
                        >
                          Sign in to continue →
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      onClick={() => base44.auth.redirectToLogin("/onboarding")}
                      className="text-primary font-semibold underline hover:opacity-80"
                    >
                      Sign in
                    </button>
                  </p>
                </>
              )}

              {/* STEP 1: Business Info */}
              {currentStep === 1 && (
                <>
                  <div>
                    <Label>Business Name</Label>
                    <Input
                      value={form.business_name}
                      onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                      placeholder="Acme HVAC Services"
                      className="mt-1.5 h-12 rounded-xl"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Select value={form.industry} onValueChange={(v) => {
                      const isHighRisk = v === 'other';
                      setForm({ ...form, industry: v, is_high_risk_industry: isHighRisk, industry_description: isHighRisk ? '' : form.industry_description });
                    }}>
                      <SelectTrigger className="mt-1.5 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="dental">Dental / Healthcare</SelectItem>
                        <SelectItem value="fitness">Fitness / Wellness</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="marketing">Marketing / Agency</SelectItem>
                        <SelectItem value="med_spa">Med Spa / Aesthetics</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="roofing">Roofing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.industry === 'other' && (
                    <div>
                      <Label>What services does your business offer? *</Label>
                      <Input
                        value={form.industry_description || ''}
                        onChange={(e) => setForm({ ...form, industry_description: e.target.value })}
                        placeholder="e.g., Consulting, Coaching, Repairs"
                        className="mt-1.5 h-12 rounded-xl"
                      />
                    </div>
                  )}
                  {form.is_high_risk_industry && (
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-orange-800">⚠️ Manual Review Required</p>
                        <p className="text-xs text-orange-700 mt-1">
                          Custom or unlisted industries require manual compliance review before activation. You'll hear from us within 24 hours.
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Business Hours</Label>
                    <Input
                      value={form.business_hours}
                      onChange={(e) => setForm({ ...form, business_hours: e.target.value })}
                      placeholder="Mon-Fri 8am-6pm"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>

                  {/* SMS Compliance Acknowledgment */}
                  <div className={`p-4 rounded-xl border-2 transition-all ${smsComplianceAgreed ? "border-accent bg-accent/5" : "border-border bg-muted/30"}`}>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${smsComplianceAgreed ? "text-accent" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">SMS Compliance Acknowledgment</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          By enabling automated SMS, you confirm that your callers have a legitimate expectation of follow-up contact from your business, and you agree to comply with the{" "}
                          <a href="/terms" target="_blank" className="text-primary underline">TCPA and our Terms of Service</a>.
                          You are solely responsible for your use of SMS features in compliance with applicable law.
                        </p>
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <Checkbox
                            checked={smsComplianceAgreed}
                            onCheckedChange={(checked) => setSmsComplianceAgreed(!!checked)}
                            className="mt-0.5"
                          />
                          <span className="text-xs font-medium leading-relaxed">
                            I understand I am responsible for SMS compliance, will only send messages to individuals who have called my business, and accept our{" "}
                            <a href="/terms" target="_blank" className="text-primary underline font-semibold">Terms</a>,{" "}
                            <a href="/privacy" target="_blank" className="text-primary underline font-semibold">Privacy Policy</a>, and{" "}
                            <a href="/dpa" target="_blank" className="text-primary underline font-semibold">DPA</a>.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: Phone */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-5 mb-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3">
                      <PhoneCall className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">How call forwarding works</p>
                        <p className="text-xs text-blue-800 mt-1">Your business number receives a call → Instantly rings your personal cell → If you miss it, SMS automatically follows within 2 seconds</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Your Personal Cell Phone *</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Select value="+1" disabled>
                          <SelectTrigger className="w-20 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="+1">+1</SelectItem></SelectContent>
                        </Select>
                        <Input
                          value={form.owner_phone_number.replace(/^\+1/, '')}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setForm({ ...form, owner_phone_number: val ? `+1${val}` : '' });
                          }}
                          placeholder="(555) 123-4567"
                          className="h-12 rounded-xl flex-1"
                          autoFocus
                        />
                        {form.owner_phone_number && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setForm({ ...form, owner_phone_number: '' })}
                            className="rounded-xl h-12 px-3"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Where calls will ring. Must be a real phone you check regularly.</p>
                    </div>
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                        <p className="text-sm font-semibold text-amber-900 mb-1">Twilio Business Number (Required) *</p>
                        <p className="text-xs text-amber-800">This is separate from your personal cell. This is the number leads will call.</p>
                      </div>
                      <p className="text-sm font-semibold mb-3">Do you have an existing Twilio account with a phone number?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setHasTwilioAccount(true)}
                          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                            hasTwilioAccount === true
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className="font-semibold text-sm">Yes</p>
                          <p className="text-xs text-muted-foreground mt-1">I have a Twilio number</p>
                        </button>
                        <button
                          onClick={() => setHasTwilioAccount(false)}
                          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                            hasTwilioAccount === false
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className="font-semibold text-sm">No</p>
                          <p className="text-xs text-muted-foreground mt-1">I need a new number</p>
                        </button>
                      </div>
                    </div>

                    {hasTwilioAccount === true && (
                      <div>
                        <Label>Your Twilio Phone Number *</Label>
                        <div className="flex gap-2 mt-1.5">
                          <Select value="+1" disabled>
                            <SelectTrigger className="w-20 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="+1">+1</SelectItem></SelectContent>
                          </Select>
                          <Input
                            value={form.phone_number.replace(/^\+1/, '')}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setForm({ ...form, phone_number: val ? `+1${val}` : '' });
                            }}
                            placeholder="(555) 123-4567"
                            className="h-12 rounded-xl flex-1"
                            autoFocus
                          />
                          {form.phone_number && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setForm({ ...form, phone_number: '' })}
                              className="rounded-xl h-12 px-3"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Your Twilio account phone number (the one leads will call). No test numbers (555).
                        </p>
                      </div>
                    )}

                    {hasTwilioAccount === false && (
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <Elements stripe={stripePromise}>
                          <PhoneProvision onSuccess={(num) => setForm({ ...form, phone_number: num })} />
                        </Elements>
                        <p className="text-xs text-blue-800 mt-2">
                          Just <span className="font-semibold">$2.99</span> to provision your dedicated number. Monthly costs start after your 7-day trial.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* STEP 3: AI Personality */}
              {currentStep === 3 && (
                <>
                  <p className="text-sm text-muted-foreground -mt-2">Choose how your AI communicates with leads. You can change this anytime.</p>
                  <div className="grid gap-3">
                    {[
                      { value: "professional", label: "Professional", desc: "Formal, polished, business-like tone" },
                      { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational — most popular" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm({ ...form, ai_personality: opt.value })}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          form.ai_personality === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 4: Booking URL — marked as critical but optional */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">This step is critical to generating revenue</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Without a booking link, the AI cannot close leads into appointments. Skipping this means missed revenue.
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Booking / Scheduling URL</Label>
                    <Input
                      value={form.booking_url}
                      onChange={(e) => setForm({ ...form, booking_url: e.target.value })}
                      placeholder="https://calendly.com/your-business"
                      className="mt-1.5 h-12 rounded-xl"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Calendly, Acuity, Google Calendar, any booking page — paste the link here</p>
                  </div>
                  {!form.booking_url && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> You can skip for now, but add this in Settings before going live
                    </p>
                  )}
                  {form.booking_url && (
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-accent">Great — your AI can now close bookings</p>
                        <p className="text-xs text-muted-foreground mt-1">This link will be sent when leads are ready to schedule.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Template Preview */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground -mt-2">This is the first message your leads will receive within seconds of a missed call.</p>
                  <div className="bg-slate-900 rounded-2xl p-5">
                    <p className="text-xs text-slate-400 mb-3 font-mono">SMS Preview</p>
                    <div className="flex justify-start">
                      <div className="bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
                        <p className="text-white text-sm leading-relaxed">{getPreviewMessage()}</p>
                        <p className="text-xs text-slate-400 mt-2">Just now</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">How it works</p>
                    <ul className="space-y-1 text-xs">
                      <li>✓ Sent within 2-5 seconds of a missed call</li>
                      <li>✓ AI continues the conversation naturally</li>
                      <li>✓ Sends your booking link when the lead is ready</li>
                    </ul>
                  </div>
                  <p className="text-xs text-muted-foreground">You can customize templates anytime in the Templates section.</p>
                </div>
              )}



              {/* STEP 6: Launch / Expectations */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  <div className="text-center py-2">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold">You're live, {form.business_name || "there"}!</h3>
                    <p className="text-sm text-muted-foreground mt-1">Here's what to realistically expect next:</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                      <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">First few hours</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your number is active. The next missed call will trigger an automatic SMS. If you provisioned a new toll-free number, full carrier activation takes 1-2 business days.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                      <TrendingUp className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">What to expect</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Results depend on your call volume and industry. The system is now actively listening for missed calls.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                      <Zap className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">To maximize results</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Add your booking link (if not done), customize your SMS templates, and check back in 48 hours to see leads in your dashboard.</p>
                      </div>
                    </div>
                  </div>
                  {/* Live status checklist */}
                  <div className="border border-border rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold mb-2">Setup Status</p>
                    <div className="flex items-center gap-2 text-sm">
                      {form.phone_number ? (
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className={form.phone_number ? "text-foreground" : "text-amber-700"}>
                        {form.phone_number ? `Phone number: ${form.phone_number}` : "Phone number not set — add in Settings"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {webhookConfigStatus === "done" ? (
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      ) : webhookConfigStatus === "loading" ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                      ) : webhookConfigStatus === "error" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      )}
                      <span>
                        {webhookConfigStatus === "done" ? "Webhooks configured — calls will be captured" :
                         webhookConfigStatus === "loading" ? "Configuring webhooks..." :
                         webhookConfigStatus === "error" ? "Webhook config pending — contact support if calls aren't captured" :
                         "Webhooks active (auto-provisioned number)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {form.booking_url ? (
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className={form.booking_url ? "text-foreground" : "text-amber-700"}>
                        {form.booking_url ? "Booking link set — AI can close appointments" : "Booking link missing — add in Settings"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      <span>Confirmation email sent to your inbox</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="ghost"
                onClick={back}
                disabled={currentStep === 0}
                className="rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {currentStep === 4 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="rounded-xl h-11 px-6"
                >
                  {form.booking_url ? 'Continue' : 'Skip'} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              {currentStep === 6 ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="rounded-xl h-11 px-6 bg-accent hover:bg-accent/90"
                >
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={next}
                  disabled={!isStepValid() || saveMutation.isPending || isSigningUp || (currentStep === 0 && (!signupEmail || !signupPassword))}
                  className="rounded-xl h-11 px-6"
                >
                  {saveMutation.isPending || isSigningUp ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <>Continue <ArrowRight className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {currentStep !== 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            You can change all of this later in Settings
          </p>
        )}
      </div>
    </div>
  );
}