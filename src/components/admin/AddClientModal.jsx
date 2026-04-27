import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, UserPlus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const INDUSTRIES = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "roofing", label: "Roofing" },
  { value: "med_spa", label: "Med Spa / Aesthetics" },
  { value: "legal", label: "Legal" },
  { value: "dental", label: "Dental / Healthcare" },
  { value: "automotive", label: "Automotive" },
  { value: "fitness", label: "Fitness / Wellness" },
  { value: "real_estate", label: "Real Estate" },
  { value: "hospitality", label: "Hospitality" },
  { value: "marketing", label: "Marketing / Agency" },
  { value: "other", label: "Other" },
];

const defaultForm = {
  email: "",
  business_name: "",
  industry: "hvac",
  industry_description: "",
  phone_number: "",
  owner_phone_number: "",
  booking_url: "",
  website: "",
  facebook_url: "",
  instagram_url: "",
  google_business_url: "",
  business_hours: "Mon-Fri 8am-6pm",
  ai_personality: "friendly",
  timezone: "America/New_York",
  plan_name: "Starter",
  trial_days: 7,
};

export default function AddClientModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const sendWelcomeEmail = async (email, business_name, plan_name, trial_days) => {
    const trialDaysNum = parseInt(trial_days) || 7;
    const resolvedPlan = plan_name === "Trial" ? "Starter" : (plan_name || "Starter");
    const planLabel = plan_name === "Trial"
      ? `${trialDaysNum}-Day Free Trial`
      : `${resolvedPlan} (${trialDaysNum}-day trial)`;

    await base44.integrations.Core.SendEmail({
      to: email,
      from_name: "CatchACaller",
      subject: `Your CatchACaller account is ready — ${business_name}`,
      body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:40px 32px;text-align:center;">
    <div style="font-size:40px;margin-bottom:12px;">📞</div>
    <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">Welcome to CatchACaller!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:15px;">${business_name} is ready to capture missed calls</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 20px 0;">Hi there,</p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
      Your CatchACaller account has been set up on the <strong>${planLabel}</strong>. Follow the steps below to get in — no credit card needed until your trial ends.
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;color:#1d4ed8;">⚡ Getting started — 2 steps:</p>
      <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
        <div style="background:#3b82f6;color:white;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">1</div>
        <div>
          <p style="margin:0 0 4px 0;font-weight:600;color:#1e3a8a;font-size:14px;">Check your inbox for an email with subject "You're invited to join CatchACaller"</p>
          <p style="margin:0;color:#1d4ed8;font-size:13px;">Click <strong>"Access app"</strong> in that email to set your password.</p>
          <p style="margin:6px 0 0 0;color:#64748b;font-size:12px;">📌 Your login email is: <strong style="color:#1e293b;">${email}</strong></p>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div style="background:#3b82f6;color:white;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">2</div>
        <div>
          <p style="margin:0 0 4px 0;font-weight:600;color:#1e3a8a;font-size:14px;">Sign in and go to your dashboard</p>
          <p style="margin:0;color:#1d4ed8;font-size:13px;">Everything is pre-configured and ready to go.</p>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="https://catchacaller.com/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Go to My Dashboard →</a>
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:20px;font-size:13px;">
      <strong style="color:#475569;">Your account summary:</strong>
      <div style="margin-top:8px;color:#64748b;line-height:1.8;">
        <div>📧 Login email: <strong style="color:#1e293b;">${email}</strong></div>
        <div>🏢 Business: <strong style="color:#1e293b;">${business_name}</strong></div>
        <div>📋 Plan: <strong style="color:#1e293b;">${planLabel}</strong></div>
      </div>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;">Questions? Email us at <a href="mailto:contact@catchacaller.com" style="color:#3b82f6;">contact@catchacaller.com</a></p>
    <p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">— The CatchACaller Team</p>
  </div>
  <div style="background:#f8fafc;padding:14px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 CatchACaller · <a href="https://catchacaller.com/privacy" style="color:#94a3b8;">Privacy</a></p>
  </div>
</div>`,
    });
  };

  const provisionMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      if (!form.email || !form.business_name) throw new Error("Email and business name are required.");

      // Backend: invite user, create profile/subscription/audit log
      const res = await base44.functions.invoke("adminProvisionClient", { ...form });
      if (res.data?.error) throw new Error(res.data.error);

      // Frontend: send branded welcome email (backend can't email unregistered users)
      await sendWelcomeEmail(form.email, form.business_name, form.plan_name, form.trial_days);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
      queryClient.invalidateQueries({ queryKey: ["all-subscriptions"] });
      setDone(true);
    },
    onError: (err) => {
      const msg = err?.message || "Something went wrong. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  const handleClose = () => {
    setDone(false);
    setErrorMsg(null);
    setForm(defaultForm);
    onClose();
  };

  const isValid = form.email && form.business_name && (form.industry !== "other" || form.industry_description);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New Client
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Client Provisioned!</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                <strong>{form.email}</strong> has been invited and their dashboard is pre-configured. They'll receive two emails: one to set their password, and one branded welcome email from CatchACaller.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full rounded-xl">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1">
              <p>The client will receive <strong>two emails</strong>:</p>
              <p>① A platform invite email with a link to set their password.</p>
              <p>② A branded CatchACaller welcome email with their account details and next steps.</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <span className="text-destructive">{errorMsg}</span>
              </div>
            )}

            {/* Required fields */}
            <div>
              <Label>Client Email *</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="owner@theirbusiness.com" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label>Business Name *</Label>
              <Input value={form.business_name} onChange={e => set("business_name", e.target.value)}
                placeholder="Acme HVAC Services" className="mt-1.5 h-11 rounded-xl" />
            </div>

            {/* Industry + Plan side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={v => set("industry", v)}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={form.plan_name} onValueChange={v => set("plan_name", v)}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trial">Trial (free)</SelectItem>
                    <SelectItem value="Starter">Starter — $49/mo</SelectItem>
                    <SelectItem value="Growth">Growth — $149/mo</SelectItem>
                    <SelectItem value="Pro">Pro — $297/mo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Industry description — directly below Industry/Plan when Other selected */}
            {form.industry === "other" && (
              <div>
                <Label>Describe Their Services *</Label>
                <Input value={form.industry_description} onChange={e => set("industry_description", e.target.value)}
                  placeholder="e.g., Consulting, Home Renovation, Pet Grooming"
                  className="mt-1.5 h-11 rounded-xl" />
              </div>
            )}

            {/* Trial days */}
            <div>
              <Label>Trial Duration (days)</Label>
              <Input type="number" min="1" max="365" value={form.trial_days}
                onChange={e => set("trial_days", e.target.value)}
                className="mt-1.5 h-11 rounded-xl" />
              <p className="text-xs text-muted-foreground mt-1">
                Full access free for this many days — no credit card required until trial expires.
              </p>
            </div>

            {/* Phone numbers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Business Phone (Twilio)</Label>
                <Input value={form.phone_number} onChange={e => set("phone_number", e.target.value)}
                  placeholder="+18005551234" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label>Owner's Cell</Label>
                <Input value={form.owner_phone_number} onChange={e => set("owner_phone_number", e.target.value)}
                  placeholder="+17705551234" className="mt-1.5 h-11 rounded-xl" />
              </div>
            </div>

            {/* Booking + Website */}
            <div>
              <Label>Booking URL</Label>
              <Input value={form.booking_url} onChange={e => set("booking_url", e.target.value)}
                placeholder="https://calendly.com/their-business" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label>Website URL</Label>
              <Input value={form.website} onChange={e => set("website", e.target.value)}
                placeholder="https://theirbusiness.com" className="mt-1.5 h-11 rounded-xl" />
            </div>

            {/* Social media */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Social Media (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Facebook</Label>
                  <Input value={form.facebook_url} onChange={e => set("facebook_url", e.target.value)}
                    placeholder="facebook.com/page" className="mt-1 h-10 rounded-xl text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Instagram</Label>
                  <Input value={form.instagram_url} onChange={e => set("instagram_url", e.target.value)}
                    placeholder="instagram.com/handle" className="mt-1 h-10 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Google Business Profile URL</Label>
                <Input value={form.google_business_url} onChange={e => set("google_business_url", e.target.value)}
                  placeholder="g.page/their-business" className="mt-1 h-10 rounded-xl text-sm" />
              </div>
            </div>

            {/* Hours + AI Personality */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Business Hours</Label>
                <Input value={form.business_hours} onChange={e => set("business_hours", e.target.value)}
                  className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label>AI Personality</Label>
                <Select value={form.ai_personality} onValueChange={v => set("ai_personality", v)}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl h-11">Cancel</Button>
              <Button
                onClick={() => provisionMutation.mutate()}
                disabled={provisionMutation.isPending || !isValid}
                className="flex-1 rounded-xl h-11"
              >
                {provisionMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Provisioning...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" />Provision & Invite</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}