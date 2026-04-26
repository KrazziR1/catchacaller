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

export default function AddClientModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    email: "",
    business_name: "",
    industry: "general",
    phone_number: "",
    owner_phone_number: "",
    booking_url: "",
    business_hours: "Mon-Fri 8am-6pm",
    ai_personality: "friendly",
    timezone: "America/New_York",
    plan_name: "Starter",
  });
  const [done, setDone] = useState(false);

  const provisionMutation = useMutation({
    mutationFn: async () => {
      if (!form.email || !form.business_name) throw new Error("Email and business name are required.");

      // 1. Invite the user — sends them a "set your password" email
      await base44.users.inviteUser(form.email, "user");

      // 2. Create their BusinessProfile under service role
      const profile = await base44.asServiceRole.entities.BusinessProfile.create({
        business_name: form.business_name,
        industry: form.industry,
        phone_number: form.phone_number || null,
        owner_phone_number: form.owner_phone_number || null,
        booking_url: form.booking_url || null,
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

      // 3. Create a trial subscription for them
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      await base44.asServiceRole.entities.Subscription.create({
        user_email: form.email,
        stripe_subscription_id: `admin_provisioned_${form.email}_${Date.now()}`,
        status: "trial",
        plan_name: form.plan_name,
        trial_end_date: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      });

      // 4. Send welcome email to client
      await base44.integrations.Core.SendEmail({
        to: form.email,
        from_name: "CatchACaller",
        subject: `Welcome to CatchACaller — ${form.business_name} is ready!`,
        body: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
            <div style="background:#3b82f6;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:white;margin:0;font-size:22px;">Welcome to CatchACaller!</h1>
              <p style="color:#bfdbfe;margin:8px 0 0 0;font-size:14px;">Your account has been set up</p>
            </div>
            <div style="background:white;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
              <p style="font-size:15px;">Hi there,</p>
              <p style="color:#475569;">Your CatchACaller account for <strong>${form.business_name}</strong> has been set up on the <strong>${form.plan_name}</strong> plan with a 7-day free trial.</p>
              <p style="color:#475569;">You should receive a separate email to set your password. Once you log in, your dashboard will be fully configured and ready to capture missed calls.</p>
              <div style="margin-top:24px;text-align:center;">
                <a href="https://catchacaller.com/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Go to My Dashboard →</a>
              </div>
              <p style="margin-top:24px;color:#64748b;font-size:13px;">Questions? Reply to this email or reach us at contact@catchacaller.com</p>
              <p style="color:#64748b;font-size:13px;">— The CatchACaller Team</p>
            </div>
          </div>
        `,
      }).catch(() => {}); // non-blocking

      // 5. Log the action
      const me = await base44.auth.me();
      await base44.asServiceRole.entities.AdminAuditLog.create({
        admin_email: me.email,
        action: "account_approved",
        target_email: form.email,
        target_business: form.business_name,
        reason: "Admin-provisioned client via white-glove onboarding",
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
    setForm({
      email: "", business_name: "", industry: "general",
      phone_number: "", owner_phone_number: "", booking_url: "",
      business_hours: "Mon-Fri 8am-6pm", ai_personality: "friendly",
      timezone: "America/New_York", plan_name: "Starter",
    });
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
                An invite email has been sent to <strong>{form.email}</strong>. They can set their password and log straight into their dashboard — everything is pre-configured.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full rounded-xl">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              Fill in the client's info. They'll receive an invite email to set their password and land directly on their pre-configured dashboard.
            </div>

            {/* Required */}
            <div className="space-y-3">
              <div>
                <Label>Client Email *</Label>
                <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="owner@theirbusiness.com" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label>Business Name *</Label>
                <Input value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})}
                  placeholder="Acme HVAC Services" className="mt-1.5 h-11 rounded-xl" />
              </div>
            </div>

            {/* Industry + Plan */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={v => setForm({...form, industry: v})}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="roofing">Roofing</SelectItem>
                    <SelectItem value="med_spa">Med Spa</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="dental">Dental</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={form.plan_name} onValueChange={v => setForm({...form, plan_name: v})}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter — $49/mo</SelectItem>
                    <SelectItem value="Growth">Growth — $149/mo</SelectItem>
                    <SelectItem value="Pro">Pro — $297/mo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Phone numbers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Business Phone (Twilio)</Label>
                <Input value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})}
                  placeholder="+18005551234" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label>Owner's Cell</Label>
                <Input value={form.owner_phone_number} onChange={e => setForm({...form, owner_phone_number: e.target.value})}
                  placeholder="+17705551234" className="mt-1.5 h-11 rounded-xl" />
              </div>
            </div>

            {/* Booking + Hours */}
            <div>
              <Label>Booking URL</Label>
              <Input value={form.booking_url} onChange={e => setForm({...form, booking_url: e.target.value})}
                placeholder="https://calendly.com/their-business" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Business Hours</Label>
                <Input value={form.business_hours} onChange={e => setForm({...form, business_hours: e.target.value})}
                  className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label>AI Personality</Label>
                <Select value={form.ai_personality} onValueChange={v => setForm({...form, ai_personality: v})}>
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
                disabled={provisionMutation.isPending || !form.email || !form.business_name}
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