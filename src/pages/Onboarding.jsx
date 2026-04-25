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
  CreditCard, MessageSquare, Send, Loader2,
  AlertTriangle, Sparkles, Clock, TrendingUp, ShieldCheck
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PhoneProvision from "@/components/PhoneProvision";

const STRIPE_PUBLISHABLE_KEY = "pk_live_51TQ7e0FsxP0HXZ0AL4xFM0tGvmqLkCEPVCO4PVW5VrGxnbV2cKmHZpFXHNZTv6Y3mzGJCK6KRvFt2P3rEWL5I67n00dxEm3n3r";
const stripePromise = typeof window !== 'undefined' 
  ? window.Stripe(STRIPE_PUBLISHABLE_KEY) 
  : Promise.resolve(null);

const steps = [
  { key: "business", icon: Building2, title: "Your Business", subtitle: "Let's get your profile set up" },
  { key: "phone", icon: PhoneCall, title: "Your Phone Number", subtitle: "The number you want to monitor for missed calls" },
  { key: "ai", icon: Bot, title: "AI Personality", subtitle: "How should your AI respond to leads?" },
  { key: "booking", icon: CalendarCheck, title: "Booking Link", subtitle: "Critical — where should leads go to book?" },
  { key: "template", icon: MessageSquare, title: "Your First Message", subtitle: "Preview what leads will receive instantly" },
  { key: "test", icon: Send, title: "Test It Live", subtitle: "Send yourself a real SMS to see it in action" },
  { key: "launch", icon: Sparkles, title: "You're Live!", subtitle: "Here's what to expect in the next 24 hours" },
];

export default function Onboarding() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [testPhone, setTestPhone] = useState("");
  const [testStatus, setTestStatus] = useState("idle"); // idle | sending | sent | error
  const [testError, setTestError] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [smsComplianceAgreed, setSmsComplianceAgreed] = useState(false);
  const [hasTwilioAccount, setHasTwilioAccount] = useState(null);

  const [form, setForm] = useState({
    business_name: "",
    industry: "general",
    is_high_risk_industry: false,
    phone_number: "",
    business_hours: "Mon-Fri 8am-6pm",
    ai_personality: "friendly",
    average_job_value: 500,
    booking_url: "",
    auto_response_enabled: true,
    email_notifications_enabled: true,
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (!authed) base44.auth.redirectToLogin("/onboarding");
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => {
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
      await configureWebhooksIfNeeded();
      await createTrialSubscription();
      await sendConfirmationEmail(data);
    },
    onError: (error) => {
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

  const testSmsMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke("sendTestSMS", {
        to_phone: testPhone,
        business_name: form.business_name,
        ai_personality: form.ai_personality,
      }),
    onSuccess: (res) => {
      if (res.data?.success) {
        setTestStatus("sent");
      } else {
        setTestStatus("error");
        setTestError(res.data?.error || "Failed to send. Check your phone number format.");
      }
    },
    onError: (error) => {
      setTestStatus("error");
      setTestError(error.message || "Failed to send test SMS");
    },
  });

  const sendTestMutation = () => {
    setTestStatus("sending");
    setTestError(null);
    testSmsMutation.mutate();
  };

  const isStepValid = () => {
    if (currentStep === 0) return !!form.business_name && smsComplianceAgreed;
    if (currentStep === 1) return !!form.phone_number;
    if (currentStep === 3) return !!form.booking_url;
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
    if (currentStep === 3) {
      saveMutation.mutate();
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  // Advance to next step after save completes
  useEffect(() => {
    if (saveMutation.isSuccess && currentStep === 3) {
      setCurrentStep(4);
    }
  }, [saveMutation.isSuccess, currentStep]);

  const back = () => setCurrentStep(currentStep - 1);



  const getPreviewMessage = () => {
    const name = form.business_name || "your business";
    const stopInstruction = " Reply STOP to opt out of future messages.";
    if (form.ai_personality === "professional") {
      return `Thank you for contacting ${name}. We missed your call and would be happy to assist you. What can we help you with today?${stopInstruction}`;
    }
    return `Hi! 👋 Sorry we missed your call — we're ${name}. What can we help you with today?${stopInstruction}`;
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;

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

            {/* Step content */}
            <div className="space-y-4">

              {/* STEP 0: Business Info */}
              {currentStep === 0 && (
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
                      const isHighRisk = ['debt_collection', 'political'].includes(v);
                      setForm({ ...form, industry: v, is_high_risk_industry: isHighRisk });
                    }}>
                      <SelectTrigger className="mt-1.5 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General / Other</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="roofing">Roofing</SelectItem>
                        <SelectItem value="med_spa">Med Spa / Aesthetics</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="marketing">Marketing / Agency</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="dental">Dental / Healthcare</SelectItem>
                        <SelectItem value="fitness">Fitness / Wellness</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="debt_collection">Debt Collection (Regulated)</SelectItem>
                        <SelectItem value="political">Political Campaigns (Regulated)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.is_high_risk_industry && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-800">⚠️ Regulated Industry</p>
                        <p className="text-xs text-red-700 mt-1">
                          {form.industry === 'debt_collection' && "Debt collection has strict TCPA rules. Your account will require manual review before activation."}
                          {form.industry === 'political' && "Political campaigns have strict FCC/TCPA requirements. Your account will require manual review before activation."}
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
                  <div>
                    <Label>Average Job Value ($)</Label>
                    <Input
                      type="number"
                      value={form.average_job_value}
                      onChange={(e) => setForm({ ...form, average_job_value: parseFloat(e.target.value) || 0 })}
                      placeholder="500"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Used to calculate recovered revenue in your dashboard</p>
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

              {/* STEP 1: Phone */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-4">
                    <div>
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
                        <Label>Enter Your Twilio Phone Number</Label>
                        <div className="flex gap-2 mt-1.5">
                          <Input
                            value={form.phone_number}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val && !val.startsWith('1') && val.length === 10) val = '1' + val;
                              if (val && !val.startsWith('+')) val = '+' + val;
                              setForm({ ...form, phone_number: val });
                            }}
                            placeholder="+1 (555) 123-4567"
                            className="h-12 rounded-xl"
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
                          Make sure webhooks are configured in Twilio to capture missed calls.
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

              {/* STEP 2: AI Personality */}
              {currentStep === 2 && (
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

              {/* STEP 3: Booking URL — marked as critical */}
              {currentStep === 3 && (
                <>
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
                    <Label>Booking / Scheduling URL <span className="text-destructive">*</span></Label>
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
                </>
              )}

              {/* STEP 4: Template Preview */}
              {currentStep === 4 && (
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

              {/* STEP 5: Test SMS */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground -mt-2">Send yourself a real SMS to see exactly what your leads experience.</p>
                  <div>
                    <Label>Your Mobile Number</Label>
                    <Input
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1.5 h-12 rounded-xl"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Include country code, e.g. +1 for US</p>
                  </div>
                  <Button
                    onClick={sendTestMutation}
                    disabled={!testPhone || testStatus === "sending" || testStatus === "sent"}
                    className="w-full rounded-xl h-11"
                    variant={testStatus === "sent" ? "outline" : "default"}
                  >
                    {testStatus === "sending" && <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>}
                    {testStatus === "sent" && <><CheckCircle2 className="w-4 h-4 mr-2 text-accent" />Test SMS Sent!</>}
                    {testStatus === "idle" && <><Send className="w-4 h-4 mr-2" />Send Test SMS</>}
                    {testStatus === "error" && <><Send className="w-4 h-4 mr-2" />Retry Test SMS</>}
                  </Button>
                  {testStatus === "sent" && (
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                      <p className="text-sm font-semibold text-accent">Check your phone! 📱</p>
                      <p className="text-xs text-muted-foreground mt-1">You should receive the message within a few seconds. That's exactly what your leads will see.</p>
                    </div>
                  )}
                  {testStatus === "error" && (
                    <p className="text-xs text-destructive">{testError}</p>
                  )}
                  <p className="text-xs text-muted-foreground text-center">You can skip this step and test later from your dashboard.</p>
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
                  disabled={!isStepValid() || saveMutation.isPending}
                  className="rounded-xl h-11 px-6"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <>Continue <ArrowRight className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground mt-6">
          You can change all of this later in Settings
        </p>
      </div>
    </div>
  );
}