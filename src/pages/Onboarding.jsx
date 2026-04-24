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
  CheckCircle2, ArrowRight, ArrowLeft, Zap 
} from "lucide-react";
import PhoneProvision from "@/components/PhoneProvision";

const steps = [
  {
    key: "business",
    icon: Building2,
    title: "Your Business",
    subtitle: "Let's get your profile set up",
  },
  {
    key: "phone",
    icon: PhoneCall,
    title: "Your Phone Number",
    subtitle: "The number you want to monitor for missed calls",
  },
  {
    key: "ai",
    icon: Bot,
    title: "AI Personality",
    subtitle: "How should your AI respond to leads?",
  },
  {
    key: "booking",
    icon: CalendarCheck,
    title: "Booking Link",
    subtitle: "Where should leads go to book an appointment?",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (!authed) base44.auth.redirectToLogin("/onboarding");
    });
  }, []);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    business_name: "",
    industry: "hvac",
    phone_number: "",
    business_hours: "Mon-Fri 8am-6pm",
    ai_personality: "friendly",
    average_job_value: 500,
    booking_url: "",
    auto_response_enabled: true,
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.BusinessProfile.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      navigate("/dashboard");
    },
  });

  const isStepValid = () => {
    if (currentStep === 0) return !!form.business_name;
    if (currentStep === 1) return !!form.phone_number;
    return true;
  };

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else saveMutation.mutate();
  };

  const back = () => setCurrentStep(currentStep - 1);

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <PhoneCall className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">CatchACaller</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentStep
                  ? "bg-accent text-accent-foreground"
                  : i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-10 h-0.5 transition-all ${i < currentStep ? "bg-accent" : "bg-border"}`} />
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
                    <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                      <SelectTrigger className="mt-1.5 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="roofing">Roofing</SelectItem>
                        <SelectItem value="med_spa">Med Spa</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="general">Other</SelectItem>
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
                </>
              )}

              {currentStep === 1 && (
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

              {currentStep === 2 && (
                <>
                  <p className="text-sm text-muted-foreground -mt-2">Choose how your AI communicates with leads. You can change this anytime.</p>
                  <div className="grid gap-3">
                    {[
                      { value: "professional", label: "Professional", desc: "Formal, polished, business-like tone" },
                      { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational — most popular" },
                      { value: "casual", label: "Casual", desc: "Relaxed, like texting a friend" },
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

              {currentStep === 3 && (
                <>
                  <div>
                    <Label>Booking / Scheduling URL</Label>
                    <Input
                      value={form.booking_url}
                      onChange={(e) => setForm({ ...form, booking_url: e.target.value })}
                      placeholder="https://calendly.com/your-business"
                      className="mt-1.5 h-12 rounded-xl"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Calendly, Acuity, Google Calendar booking — anything works</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 flex gap-3">
                    <CalendarCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-accent">You're almost ready!</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        The AI will include this link in conversations when a lead is ready to book. This is how calls turn into revenue.
                      </p>
                    </div>
                  </div>
                </>
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
                {currentStep === steps.length - 1 ? (
                  saveMutation.isPending ? "Setting up..." : "Launch Dashboard"
                ) : (
                  "Continue"
                )}
                <ArrowRight className="ml-2 w-4 h-4" />
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