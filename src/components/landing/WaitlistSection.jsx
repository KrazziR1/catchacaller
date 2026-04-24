import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export default function WaitlistSection() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    email: "",
    business_name: "",
    phone: "",
    industry: "hvac",
    monthly_calls: "50_200",
  });

  const handleStep1 = () => {
    if (!form.email) return;
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await base44.entities.WaitlistEntry.create(form);
    // Send confirmation email
    await base44.functions.invoke('sendWaitlistConfirmationEmail', {
      email: form.email,
      business_name: form.business_name,
    });
    setLoading(false);
    setDone(true);
  };

  return (
    <section id="waitlist" className="py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-primary">Limited Early Access</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Get early access to<br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CatchACaller
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join service businesses across every industry recovering missed calls automatically. First 25 get 30 days free.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-10"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">You're on the list!</h3>
              <p className="text-muted-foreground">
                We'll reach out to <span className="font-semibold text-foreground">{form.email}</span> within 24 hours to get you set up.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-8 text-left"
            >
              {/* Progress */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {s}
                    </div>
                    {s < 2 && <div className={`flex-1 h-0.5 transition-all ${step > s ? "bg-primary" : "bg-border"}`} />}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="font-bold text-lg mb-1">What's your email?</p>
                      <p className="text-sm text-muted-foreground mb-4">We'll use this to set up your account.</p>
                      <Input
                        type="email"
                        placeholder="you@yourbusiness.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="h-12 rounded-xl"
                        onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                      />
                    </div>
                    <Button
                      className="w-full h-12 rounded-xl"
                      onClick={handleStep1}
                      disabled={!form.email}
                    >
                      Continue
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="font-bold text-lg mb-1">Tell us about your business</p>
                      <p className="text-sm text-muted-foreground mb-4">So we can customize your setup.</p>
                    </div>
                    <Input
                      placeholder="Business name"
                      value={form.business_name}
                      onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                    <Input
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Industry" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hvac">HVAC</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="roofing">Roofing</SelectItem>
                          <SelectItem value="med_spa">Med Spa</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={form.monthly_calls} onValueChange={(v) => setForm({ ...form, monthly_calls: v })}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Monthly calls" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under_50">Under 50 calls</SelectItem>
                          <SelectItem value="50_200">50–200 calls</SelectItem>
                          <SelectItem value="200_500">200–500 calls</SelectItem>
                          <SelectItem value="500_plus">500+ calls</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full h-12 rounded-xl"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Join the Waitlist
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                    <button
                      className="text-xs text-muted-foreground w-full text-center hover:text-foreground transition-colors"
                      onClick={() => setStep(1)}
                    >
                      ← Back
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-muted-foreground mt-6">
          No spam. No credit card. We'll personally reach out to onboard you.
        </p>
      </div>
    </section>
  );
}