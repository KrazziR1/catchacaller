import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Globe, Calendar, Zap, Users, MessageSquare, Copy, Check, AlertCircle, PhoneCall } from "lucide-react";
import { toast } from "sonner";

export default function BusinessDetailModal({ business, isOpen, onClose }) {
  const [copied, setCopied] = useState(null);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{business.business_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {business.industry}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timezone</p>
                  <p className="text-sm font-medium mt-1">{business.timezone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Business Hours</p>
                  <p className="text-sm font-medium mt-1">{business.business_hours}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Job Value</p>
                  <p className="text-sm font-medium mt-1">${business.average_job_value}</p>
                </div>
              </div>
              <div className="space-y-2">
                {business.phone_number && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <p className="text-sm font-mono">{business.phone_number}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(business.phone_number, "phone")}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copied === "phone" ? "✓" : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                {business.booking_url && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-accent" />
                      <a
                        href={business.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline truncate"
                      >
                        {business.booking_url}
                      </a>
                    </div>
                    <button
                      onClick={() => copyToClipboard(business.booking_url, "booking")}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copied === "booking" ? "✓" : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                {business.twilio_number_sid && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-chart-1" />
                      <p className="text-sm font-mono">{business.twilio_number_sid}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(business.twilio_number_sid, "twilio")}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copied === "twilio" ? "✓" : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">AI Personality</p>
                  <Badge variant="outline" className="mt-1 capitalize text-xs">
                    {business.ai_personality || "—"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approval Status</p>
                  {business.requires_manual_review ? (
                    <Badge className="bg-destructive/20 text-destructive mt-1 text-xs">Pending Review</Badge>
                  ) : (
                    <Badge className="bg-accent/20 text-accent mt-1 text-xs">Approved</Badge>
                  )}
                </div>
                </div>
                </CardContent>
                </Card>

          {/* Subscription */}
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

          {/* Usage Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Usage</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Conversations</p>
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

          {/* SMS Metrics */}
          {business.phone_number && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SMS Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Numbers Opted Out</p>
                    <p className="text-2xl font-bold mt-1">{optOuts.length}</p>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {optOuts.length > 0 && `Last: ${new Date(optOuts[0].opted_out_at).toLocaleDateString()}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> Team ({teamMembers.length})
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
        </div>
      </DialogContent>
    </Dialog>
  );
}