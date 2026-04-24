import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, Phone, Globe, Calendar, Bot, DollarSign, Save, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import PhoneProvision from "@/components/PhoneProvision";
import TeamManagement from "@/components/team/TeamManagement";
import CRMSettings from "@/components/crm/CRMSettings";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    business_name: "",
    industry: "hvac",
    phone_number: "",
    booking_url: "",
    website: "",
    timezone: "America/New_York",
    business_hours: "Mon-Fri 8am-6pm",
    auto_response_enabled: true,
    ai_personality: "friendly",
    average_job_value: 500,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => base44.entities.BusinessProfile.list("-created_date", 1),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => base44.entities.Subscription.list("-created_date", 1),
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const profile = profiles[0];
  const subscription = subscriptions[0];

  const [loading, setLoading] = useState(false);

  const handleManageBilling = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("createPortalSession", {});
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || "",
        industry: profile.industry || "general",
        phone_number: profile.phone_number || "",
        booking_url: profile.booking_url || "",
        website: profile.website || "",
        timezone: profile.timezone || "America/New_York",
        business_hours: profile.business_hours || "Mon-Fri 8am-6pm",
        auto_response_enabled: profile.auto_response_enabled !== false,
        ai_personality: profile.ai_personality || "friendly",
        average_job_value: profile.average_job_value || 500,
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return base44.entities.BusinessProfile.update(profile.id, data);
      } else {
        return base44.entities.BusinessProfile.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      toast.success("Settings saved successfully");
    },
  });

  const handleSave = () => saveMutation.mutate(formData);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your business profile and AI behavior</p>
      </div>

      <div className="space-y-6">
        {/* Subscription Management */}
        {subscription && (
          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Subscription</CardTitle>
                  <CardDescription>Manage your billing and plan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Plan</p>
                  <p className="text-lg font-semibold">{subscription.plan_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subscription.status === 'active' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleManageBilling} 
                disabled={loading}
                variant="outline"
                className="w-full rounded-xl"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage Billing
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Business Info */}
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Business Information</CardTitle>
                <CardDescription>Your company details for SMS personalization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Business Name</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Acme HVAC Services"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone Number</Label>
                {formData.phone_number ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} />
                  </div>
                ) : (
                  <div className="mt-1.5 space-y-3">
                    <PhoneProvision onSuccess={(num) => setFormData({ ...formData, phone_number: num })} />
                    <Input
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="Or enter existing number manually"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://acmehvac.com"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Booking URL</Label>
              <Input
                value={formData.booking_url}
                onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                placeholder="https://calendly.com/your-business"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Business Hours</Label>
              <Input
                value={formData.business_hours}
                onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                placeholder="Mon-Fri 8am-6pm"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* AI Settings */}
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Configuration</CardTitle>
                <CardDescription>Control how the AI responds to leads</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-Response</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically send SMS when a call is missed</p>
              </div>
              <Switch
                checked={formData.auto_response_enabled}
                onCheckedChange={(v) => setFormData({ ...formData, auto_response_enabled: v })}
              />
            </div>
            <div>
              <Label>AI Personality</Label>
              <Select value={formData.ai_personality} onValueChange={(v) => setFormData({ ...formData, ai_personality: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <TeamManagement profile={profile} subscription={subscription} user={user} />

        <Separator />

        <CRMSettings profile={profile} subscription={subscription} />

        <Separator />

        {/* Revenue Settings */}
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <CardTitle className="text-lg">Revenue Tracking</CardTitle>
                <CardDescription>Set your average job value for ROI calculations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Average Job Value ($)</Label>
              <Input
                type="number"
                value={formData.average_job_value}
                onChange={(e) => setFormData({ ...formData, average_job_value: parseFloat(e.target.value) || 0 })}
                placeholder="500"
                className="mt-1.5 w-40"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Used to estimate recovered revenue per booking</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="rounded-xl h-12 px-8" disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}