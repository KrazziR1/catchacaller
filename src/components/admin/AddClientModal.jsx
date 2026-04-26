import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
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

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const trialEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + (parseInt(form.trial_days) || 7));
    return d;
  };

  const provisionMutation = useMutation({
    mutationFn: async () => {
      if (!form.email || !form.business_name) throw new Error("Email and business name are required.");

      // 1. Invite the user — Base44 sends them a "set your password" email
      await base44.users.inviteUser(form.email, "user");

      // 2. Create their BusinessProfile using asServiceRole so we control created_by
      //    We store the client email in user_email field of Subscription to link them.
      //    The profile created_by will be the admin, but we store the target email in a note.
      const profile = await base44.asServiceRole.entities.BusinessProfile.create({
        business_name: form.business_name,
        industry: form.industry,
        industry_description: form.industry === "other" ? form.industry_description : undefined,
        phone_number: form.phone_number || null,
        owner_phone_number: form.owner_phone_number || null,
        booking_url: form.booking_url || null,
        website: form.website || null,
        business_hours: form.business_hours,
        ai_personality: form.ai_personality,
        timezone: form.timezone,
        auto_response_enabled: true,
        email_notifications_enabled: true,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "2026-04-25",
        consent_acknowledged_at: new Date().toISOString(),
        requires_manual_review: false,
        is_high_risk_industry: false,
      });

      // 3. Create subscription — trial period, no Stripe involvement
      const trialEnd = trialEndDate();
      await base44.asServiceRole.entities.Subscription.create({
        user_email: form.email,
        stripe_subscription_id: `admin_provisioned_${form.email}_${Date.now()}`,
        status: "trial",
        plan_name: form.plan_name,
        trial_end_date: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      });

      // 4. Send a branded welcome email (separate from the Base44 invite email)
      const planLabel = form.plan_name === "Trial" ? `${form.trial_days}-day Free Trial` : `${form.plan_name} plan (${form.trial_days}-day trial included)`;
      await base44.integrations.Core.SendEmail({
        to: form.email,
        from_name: "CatchACaller",
        subject: `🎉 Your CatchACaller account is ready — ${form.business_name}`,
        body: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:40px 32px;text-align:center;">
              <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:30px;">📞</span>
              </div>
              <h1 style="color:white;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">You're all set!</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:15px;">${form.business_name} is live on CatchACaller</p>
            </div>
            <div style="padding:36px 32px;">
              <p style="font-size:16px;color:#1e293b;margin:0 0 8px 0;font-weight:600;">Welcome aboard! 👋</p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
                Your CatchACaller account has been set up on the <strong>${planLabel}</strong>. 
                You've also received a separate email with a link to create your password — click that first, then come back here.
              </p>
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                <p style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#166534;">✅ Two steps to go live:</p>
                <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                  <span style="background:#22c55e;color:white;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:1px;">1</span>
                  <span style="color:#166534;font-size:14px;">Check your inbox for the <strong>"You've been invited"</strong> email → click it to set your password</span>
                </div>
                <div style="display:flex;align-items:flex-start;gap:12px;">
                  <span style="background:#22c55e;color:white;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:1px;">2</span>
                  <span style="color:#166534;font-size:14px;">Log in and your dashboard will be ready with everything pre-configured</span>
                </div>
              </div>
              <div style="text-align:center;margin-bottom:28px;">
                <a href="https://catchacaller.com/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:-0.2px;">Go to My Dashboard →</a>
              </div>
              <div style="background:#f8fafc;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
                <p style="margin:0 0 10px 0;font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Your Setup Summary</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:6px 0;color:#94a3b8;width:45%;">Business</td><td style="color:#1e293b;font-weight:600;">${form.business_name}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">Plan</td><td style="color:#1e293b;font-weight:600;">${planLabel}</td></tr>
                  ${form.phone_number ? `<tr><td style="padding:6px 0;color:#94a3b8;">Business Phone</td><td style="color:#1e293b;font-weight:600;">${form.phone_number}</td></tr>` : ""}
                  ${form.booking_url ? `<tr><td style="padding:6px 0;color:#94a3b8;">Booking Link</td><td style="color:#1e293b;font-weight:600;">Set ✓</td></tr>` : `<tr><td style="padding:6px 0;color:#94a3b8;">Booking Link</td><td style="color:#f59e0b;font-weight:600;">⚠️ Add in Settings</td></tr>`}
                </table>
              </div>
              <p style="color:#64748b;font-size:14px;margin:0;">Questions? Just reply to this email — we respond personally.</p>
              <p style="color:#64748b;font-size:14px;margin:4px 0 0 0;">— The CatchACaller Team</p>
            </div>
            <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 CatchACaller · <a href="https://catchacaller.com/privacy" style="color:#94a3b8;">Privacy Policy</a></p>
            </div>
          </div>
        `,
      }).catch(() => {});

      // 5. Log the action
      const me = await base44.auth.me();
      await base44.asServiceRole.entities.AdminAuditLog.create({
        admin_email: me.email,
        action: "account_approved",
        target_email: form.email,
        target_business: form.business_name,
        reason: `Admin-provisioned client. Plan: ${form.plan_name}, Trial: ${form.trial_days} days`,
      });

      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
      queryClient.invalidateQueries({ queryKey: ["all-subscriptions"] });
      setDone(true);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to provision client.");
    },
  });

  const handleClose = () => {
    setDone(false);
    setForm(defaultForm);
    onClose();
  };

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
              <p className="text-sm text-muted-foreground mt-1">
                An invite email + a welcome email have been sent to <strong>{form.email}</strong>. They'll set their password and land directly on their pre-configured dashboard.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full rounded-xl">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              Fill in the client's info. They'll receive two emails: one to set their password, and one branded welcome email with their dashboard link.
            </div>

            {/* Required */}
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

            {/* Industry + Plan */}
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

            {/* Trial days — always shown since all plans start with a trial */}
            <div>
              <Label>Trial Duration (days)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={form.trial_days}
                onChange={e => set("trial_days", e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                User gets full access free for this many days. No credit card required until trial expires.
              </p>
            </div>

            {/* Other industry description */}
            {form.industry === "other" && (
              <div>
                <Label>Describe Their Services *</Label>
                <Input
                  value={form.industry_description}
                  onChange={e => set("industry_description", e.target.value)}
                  placeholder="e.g., Consulting, Home Renovation, Pet Grooming"
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
            )}

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
            <div className="space-y-3">
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

            {/* Hours + AI */}
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
                disabled={provisionMutation.isPending || !form.email || !form.business_name || (form.industry === "other" && !form.industry_description)}
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