import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const plans = [
  {
    name: "Starter",
    price: "$49/mo",
    priceId: "price_1TPruHFsxP0HXZ0ANSkOGCp0",
    description: "Solo operators",
    features: ["Missed call detection", "Instant SMS auto-response", "100 SMS/month"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$149/mo",
    priceId: "price_1TPrvMFsxP0HXZ0Apho3zV1j",
    description: "Growing businesses",
    features: ["AI conversation handling", "500 SMS/month", "Pipeline & lead scoring", "CRM integrations"],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$297/mo",
    priceId: "price_1TPrvzFsxP0HXZ0AP2nb21Ne",
    description: "Multi-location",
    features: ["Unlimited SMS", "Calendar booking & sync", "Multi-location", "Dedicated account manager"],
    highlighted: false,
  },
];

const steps = [
  { key: "plan", icon: CreditCard, title: "Choose Your Plan", subtitle: "Start free for 7 days, cancel anytime" },
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
  const [selectedPlan, setSelectedPlan] = useState("Growth");
  const [testPhone, setTestPhone] = useState("");
  const [testStatus, setTestStatus] = useState("idle"); // idle | sending | sent | error
  const [testError, setTestError] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [smsComplianceAgreed, setSmsComplianceAgreed] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    industry: "general",
    phone_number: "",
    business_hours: "Mon-Fri 8am-6pm",
    ai_personality: "friendly",
    average_job_value: 500,
    booking_url: "",
    auto_response_enabled: true,
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (!authed) base44.auth.redirectToLogin("/onboarding");
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (profileId) {
        return base44.entities.BusinessProfile.update(profileId, form);
      }
      return base44.entities.BusinessProfile.create(form);
    },
    onSuccess: (data) => {
      if (!profileId) setProfileId(data.id);
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      setCurrentStep(currentStep + 1);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (priceId) => base44.functions.invoke("createCheckoutSession", { priceId }),
    onSuccess: (res) => {
      if (res.data?.url) window.location.href = res.data.url;
    },
  });

  const sendTestMutation = async () => {
    setTestStatus("sending");
    setTestError(null);
    const res = await base44.functions.invoke("sendTestSMS", {
      to_phone: testPhone,
      business_name: form.business_name,
      ai_personality: form.ai_personality,
    });
    if (res.data?.success) {
      setTestStatus("sent");
    } else {
      setTestStatus("error");
      setTestError(res.data?.error || "Failed to send. Check your phone number format.");
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) return !!selectedPlan;
    if (currentStep === 1) return !!form.business_name && smsComplianceAgreed;
    if (currentStep === 2) return !!form.phone_number;
    return true;
  };

  const next = () => {
    // Step 5 = booking (index 4), step 5 = template preview (index 5)
    // Before moving from booking step, save the profile
    if (currentStep === 4) {
      // Save profile before moving to template step
      saveMutation.mutate();
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step — go to dashboard
      navigate("/dashboard");
    }
  };

  const back = () => setCurrentStep(currentStep - 1);

  const handleCheckout = () => {
    const plan = plans.find((p) => p.name === selectedPlan);
    if (plan) checkoutMutation.mutate(plan.priceId);
  };

  const getPreviewMessage = () => {
    const name = form.business_name || "your business";
    if (form.ai_personality === "professional") {
      return `Thank you for contacting ${name}. We missed your call and would be happy to assist you. What can we help you with today?`;
    }
    return `Hi! 👋 Sorry we missed your call — we're ${name}. What can we help you with today?`;
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

              {/* STEP 0: Plan Selection */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground -mt-2">All plans include a 7-day free trial. No credit card required to complete setup.</p>
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.name}
                        onClick={() => setSelectedPlan(plan.name)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedPlan === plan.name
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{plan.name}</p>
                            {plan.highlighted && (
                              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-semibold">Most Popular</span>
                            )}
                          </div>
                          <p className="font-bold text-sm">{plan.price}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{plan.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.features.map((f, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">You'll set up billing after completing onboarding</p>
                </div>
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
                    <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
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
                      </SelectContent>
                    </Select>
                  </div>
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
                            I understand I am responsible for SMS compliance and will only send messages to individuals who have called my business.
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
                  <PhoneProvision onSuccess={(num) => setForm({ ...form, phone_number: num })} />
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or enter manually</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div>
                    <Label>Enter Existing Phone Number</Label>
                    <Input
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">If you already have a number configured in Twilio</p>
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

              {/* STEP 4: Booking URL — marked as critical */}
              {currentStep === 4 && (
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

              {/* STEP 6: Test SMS */}
              {currentStep === 6 && (
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

              {/* STEP 7: Launch / Expectations */}
              {currentStep === 7 && (
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
                        <p className="text-sm font-semibold">First 24-48 hours</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Most customers see their first recovered lead within 24 hours. Businesses with high call volume see results faster.</p>
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
                  {!form.booking_url && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        <span className="font-bold">Reminder:</span> You skipped the booking link. Add it in <span className="font-semibold">Settings → Business Profile</span> before your first call.
                      </p>
                    </div>
                  )}
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
              <Button
                onClick={next}
                disabled={!isStepValid() || saveMutation.isPending}
                className="rounded-xl h-11 px-6"
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : currentStep === 7 ? (
                  <>Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" /></>
                ) : currentStep === 6 ? (
                  <>Continue <ArrowRight className="ml-2 w-4 h-4" /></>
                ) : (
                  <>Continue <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </Button>
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