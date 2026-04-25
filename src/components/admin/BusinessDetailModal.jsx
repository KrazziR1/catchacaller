import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Globe, Calendar, Zap, Users, MessageSquare, Copy, Check, AlertCircle, PhoneCall, Shield, Mail, Trash2, AlertTriangle, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

export default function BusinessDetailModal({ business, isOpen, onClose }) {
  const [copied, setCopied] = useState(null);
  const [deleteMode, setDeleteMode] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [businessName, setBusinessName] = useState(business?.business_name || "");
  const [editData, setEditData] = useState({
    industry: business?.industry || "",
    ai_personality: business?.ai_personality || "",
    timezone: business?.timezone || "",
    business_hours: business?.business_hours || "",
    average_job_value: business?.average_job_value || 500,
    requires_manual_review: business?.requires_manual_review || false,
  });
  const queryClient = useQueryClient();

  const { data: sub } = useQuery({
    queryKey: ["subscription", business?.created_by],
    queryFn: () =>
      base44.asServiceRole.entities.Subscription.filter({
        user_email: business.created_by,
      }).then((res) => res[0]),
    enabled: !!business,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team", business?.id],
    queryFn: () =>
      base44.asServiceRole.entities.TeamMember.filter({
        account_id: business.id,
      }),
    enabled: !!business,
  });

  const { data: optOuts = [] } = useQuery({
    queryKey: ["optouts", business?.phone_number],
    queryFn: () =>
      base44.asServiceRole.entities.SMSOptOut.filter({
        business_phone: business?.phone_number,
      }),
    enabled: !!business?.phone_number,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", business?.id],
    queryFn: () =>
      base44.asServiceRole.entities.Conversation.filter({
        created_by: business?.created_by,
      }),
    enabled: !!business,
  });

  const updateBusinessNameMutation = useMutation({
    mutationFn: (newName) =>
      base44.asServiceRole.entities.BusinessProfile.update(business.id, {
        business_name: newName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
      setEditingName(false);
      toast.success("Business name updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update business name");
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: (data) =>
      base44.asServiceRole.entities.BusinessProfile.update(business.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
      toast.success("Business updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update business");
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: async (hardDelete) => {
      try {
        if (hardDelete) {
          await base44.asServiceRole.entities.BusinessProfile.delete(business.id);
        } else {
          await base44.asServiceRole.entities.AdminAuditLog.create({
            admin_email: (await base44.auth.me()).email,
            action: "account_rejected",
            target_email: business.created_by,
            target_business: business.business_name,
            reason: "Soft deleted - disabled via admin panel",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
        toast.success(hardDelete ? "Business deleted permanently" : "Business disabled");
        setConfirmDelete(false);
        onClose();
      } catch (error) {
        toast.error(error.message || "Failed to delete business");
      }
    },
  });

  if (!business) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const bookedCount = conversations.filter((c) => c.status === "booked").length;
  const activeCount = conversations.filter((c) => c.status === "active").length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name"
                className="text-lg font-semibold"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => updateBusinessNameMutation.mutate(businessName)}
                disabled={updateBusinessNameMutation.isPending || businessName === business.business_name}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingName(false);
                  setBusinessName(business.business_name);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{businessName}</DialogTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingName(true)}
                className="h-8 w-8"
                title="Edit business name"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Industry</label>
                    <select value={editData.industry} onChange={(e) => setEditData({...editData, industry: e.target.value})} className="w-full px-2 py-1.5 rounded border border-border text-sm">
                      <option value="general">General</option>
                      <option value="hvac">HVAC</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="roofing">Roofing</option>
                      <option value="med_spa">Med Spa</option>
                      <option value="legal">Legal</option>
                      <option value="hospitality">Hospitality</option>
                      <option value="marketing">Marketing</option>
                      <option value="real_estate">Real Estate</option>
                      <option value="dental">Dental</option>
                      <option value="fitness">Fitness</option>
                      <option value="automotive">Automotive</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Timezone</label>
                    <Input value={editData.timezone} onChange={(e) => setEditData({...editData, timezone: e.target.value})} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Business Hours</label>
                    <Input value={editData.business_hours} onChange={(e) => setEditData({...editData, business_hours: e.target.value})} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Avg Job Value ($)</label>
                    <Input type="number" value={editData.average_job_value} onChange={(e) => setEditData({...editData, average_job_value: Number(e.target.value)})} className="text-sm" />
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground">Business Phone Number</p>
                  </div>
                  {business.phone_number ? (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <p className="text-sm font-mono">{business.phone_number}</p>
                      <button
                        onClick={() => copyToClipboard(business.phone_number, "phone")}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copied === "phone" ? "✓" : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Not provisioned</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneCall className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground">Twilio Phone SID</p>
                  </div>
                  {business.twilio_number_sid ? (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <p className="text-sm font-mono text-xs">{business.twilio_number_sid}</p>
                      <button
                        onClick={() => copyToClipboard(business.twilio_number_sid, "twilio")}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copied === "twilio" ? "✓" : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Not configured</p>
                  )}
                </div>

                {business.booking_url && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground">Booking URL</p>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <a
                        href={business.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline truncate"
                      >
                        {business.booking_url}
                      </a>
                      <button
                        onClick={() => copyToClipboard(business.booking_url, "booking")}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copied === "booking" ? "✓" : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                   <div>
                     <label className="text-xs text-muted-foreground block mb-1.5">AI Personality</label>
                     <select value={editData.ai_personality} onChange={(e) => setEditData({...editData, ai_personality: e.target.value})} className="w-full px-2 py-1.5 rounded border border-border text-sm">
                       <option value="friendly">Friendly</option>
                       <option value="professional">Professional</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-muted-foreground block mb-1.5">Approval Status</label>
                     <div className="flex items-center gap-2">
                       <input type="checkbox" checked={!editData.requires_manual_review} onChange={(e) => setEditData({...editData, requires_manual_review: !e.target.checked})} className="rounded" />
                       <span className="text-sm">{editData.requires_manual_review ? "Pending Review" : "Approved"}</span>
                     </div>
                   </div>
                 </div>
              </CardContent>
            </Card>

            {/* Subscription Card */}
            {sub && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Subscription</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="text-sm font-medium mt-1">{sub.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      className={
                        ["active", "trialing"].includes(sub.status)
                          ? "bg-accent/20 text-accent mt-1"
                          : "bg-destructive/20 text-destructive mt-1"
                      }
                    >
                      {sub.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Period Ends</p>
                    <p className="text-sm font-medium mt-1">
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Owner */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Account Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono">{business.created_by}</p>
                  <p className="text-xs text-muted-foreground">
                    Signed up {new Date(business.created_date).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Conversation Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{conversations.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-lg font-bold">{activeCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-chart-4" />
                  <div>
                    <p className="text-xs text-muted-foreground">Booked</p>
                    <p className="text-lg font-bold">{bookedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4 mt-4">
            {business.phone_number && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" /> SMS Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="text-xs text-muted-foreground">Numbers Opted Out</p>
                      <p className="text-lg font-bold mt-1">{optOuts.length}</p>
                    </div>
                    {optOuts.length > 0 && (
                      <p className="text-xs text-muted-foreground text-right">
                        Last: {new Date(optOuts[0].opted_out_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Terms & Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${business.terms_accepted_at ? "text-accent" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Terms Accepted</p>
                      <p className="text-sm font-medium mt-1">
                        {business.terms_accepted_at 
                          ? new Date(business.terms_accepted_at).toLocaleDateString()
                          : "Not accepted"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    {business.is_high_risk_industry ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <Check className="w-4 h-4 text-accent" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Industry Classification</p>
                      <Badge 
                        variant={business.is_high_risk_industry ? "destructive" : "outline"}
                        className="mt-1 text-xs"
                      >
                        {business.is_high_risk_industry ? "High Risk" : "Standard"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {business.consent_acknowledged_at && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Check className="w-4 h-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">SMS Consent Acknowledged</p>
                      <p className="text-sm font-medium mt-1">
                        {new Date(business.consent_acknowledged_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" /> Team Members ({teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No team members added</p>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((tm) => (
                      <div key={tm.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm font-mono">{tm.user_email}</p>
                          <Badge variant="outline" className="text-xs mt-1 capitalize">
                            {tm.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tm.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>

          {/* Delete Actions */}
          {confirmDelete && (
          <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Delete Business Account</p>
                <p className="text-xs text-destructive/80 mt-1">This action cannot be undone. Choose an option:</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  setDeleteMode("soft");
                  deleteBusinessMutation.mutate(false);
                }}
                disabled={deleteBusinessMutation.isPending}
              >
                Disable Only (Keep Data)
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setDeleteMode("hard");
                  deleteBusinessMutation.mutate(true);
                }}
                disabled={deleteBusinessMutation.isPending}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
          )}

          {!confirmDelete && (
          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => updateBusinessMutation.mutate(editData)}
              disabled={updateBusinessMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {updateBusinessMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Business
            </Button>
          </DialogFooter>
          )}
          </DialogContent>
          </Dialog>
          );
          }