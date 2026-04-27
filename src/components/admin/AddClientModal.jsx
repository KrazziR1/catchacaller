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

  const provisionMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      if (!form.email || !form.business_name) throw new Error("Email and business name are required.");

      // Step 1: Backend — invite user, create profile/subscription/audit log
      const res = await base44.functions.invoke("adminProvisionClient", { ...form });
      if (res.data?.error) throw new Error(res.data.error);

      // Step 2: Send branded welcome email via Resend (non-fatal if domain not yet verified)
      try {
        await base44.functions.invoke("sendClientWelcomeEmail", {
          email: form.email,
          business_name: form.business_name,
          plan_name: form.plan_name,
          trial_days: form.trial_days,
        });
      } catch (emailErr) {
        console.warn("Welcome email failed (non-fatal):", emailErr.message);
      }
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
                <strong>{form.email}</strong> has been invited and their dashboard is pre-configured. They'll receive a platform invite email to set their password. A branded CatchACaller welcome email will also be sent once <strong>catchacaller.com</strong> is verified at <a href="https://resend.com/domains" target="_blank" className="text-primary underline">resend.com/domains</a>.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full rounded-xl">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1">
              <p>The client will receive a <strong>platform invite email</strong> to set their password. A branded welcome email will also be attempted via Resend (requires domain verification at resend.com/domains).</p>
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