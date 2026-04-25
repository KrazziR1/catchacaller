import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, TrendingUp, FileText, Download } from "lucide-react";

export default function ComplianceDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [lookbackDays, setLookbackDays] = useState(30);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u || u.role !== 'admin') {
        navigate('/');
      }
    }).catch(() => navigate('/'));
  }, [navigate]);

  const { data: auditReport, isLoading: auditLoading } = useQuery({
    queryKey: ["compliance-audit", lookbackDays],
    queryFn: async () => {
      const res = await base44.functions.invoke("complianceAudit", { lookback_days: lookbackDays });
      return res.data;
    },
    enabled: !!user,
  });

  const { data: optOuts = [] } = useQuery({
    queryKey: ["sms-optouts"],
    queryFn: () => base44.asServiceRole.entities.SMSOptOut.list("-opted_out_at", 100),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["sms-audit-logs", lookbackDays],
    queryFn: async () => {
      const allLogs = await base44.asServiceRole.entities.SMSAuditLog.list("-sent_at", 500);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - lookbackDays);
      return allLogs.filter(log => new Date(log.sent_at) > cutoff);
    },
  });

  const { data: consents = [] } = useQuery({
    queryKey: ["lead-consents"],
    queryFn: () => base44.asServiceRole.entities.LeadConsent.list("-called_at", 500),
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  const expiredConsents = consents.filter(c => new Date() > new Date(c.ebs_expiration_date));
  const expiringConsents = consents.filter(c => {
    const daysLeft = Math.ceil((new Date(c.ebs_expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 7;
  });

  const failedSMS = auditLogs.filter(log => log.status === 'failed');
  const compliancePassRate = auditLogs.length > 0 
    ? Math.round((auditLogs.filter(log => log.status === 'sent').length / auditLogs.length) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Compliance Dashboard</h1>
          <p className="text-muted-foreground mt-1">SMS TCPA & GDPR compliance monitoring</p>
        </div>

        {/* Critical Alerts */}
        {auditReport?.issues?.length > 0 && (
          <Alert className="mb-8 border-destructive/30 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Compliance Issues Detected</AlertTitle>
            <AlertDescription className="text-destructive/90">
              {auditReport.issues.filter(i => i.severity === 'CRITICAL').length} critical violations found in the past {lookbackDays} days
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">SMS Sent</CardTitle>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{auditReport?.stats?.total_sms_sent || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Last {lookbackDays} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Compliance Rate</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{compliancePassRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">SMS sent successfully</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Issues Found</CardTitle>
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{auditReport?.total_issues || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Require review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Opt-Outs</CardTitle>
                <ShieldAlert className="w-4 h-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{optOuts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Numbers opted out</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues">Issues ({auditReport?.total_issues || 0})</TabsTrigger>
            <TabsTrigger value="consents">EBR Status</TabsTrigger>
            <TabsTrigger value="optouts">Opt-Outs</TabsTrigger>
            <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Issues Tab */}
          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Compliance Issues</CardTitle>
                  <Select value={lookbackDays.toString()} onValueChange={(v) => setLookbackDays(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : auditReport?.issues?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">✓ No issues detected</p>
                ) : (
                  <div className="space-y-2">
                    {auditReport?.issues?.map((issue, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        {issue.severity === 'CRITICAL' ? (
                          <AlertTriangle className="w-4 h-4 text-destructive mt-1 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-chart-2 mt-1 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{issue.message}</p>
                            <Badge variant={issue.severity === 'CRITICAL' ? 'destructive' : 'outline'}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {issue.phone} • {new Date(issue.sent_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EBR Status Tab */}
          <TabsContent value="consents" className="space-y-4">
            {expiredConsents.length > 0 && (
              <Alert className="border-destructive/30 bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive">{expiredConsents.length} Expired Consents</AlertTitle>
                <AlertDescription className="text-destructive/90">
                  Cannot contact these numbers unless new consent is obtained
                </AlertDescription>
              </Alert>
            )}

            {expiringConsents.length > 0 && (
              <Alert className="border-chart-2/30 bg-chart-2/10">
                <Clock className="h-4 w-4 text-chart-2" />
                <AlertTitle className="text-chart-2">{expiringConsents.length} Expiring Soon</AlertTitle>
                <AlertDescription className="text-chart-2/90">
                  EBR expires within 7 days
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Consent Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Valid</p>
                  <p className="text-2xl font-bold">{consents.filter(c => c.is_valid && new Date() < new Date(c.ebs_expiration_date)).length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold text-chart-2">{expiringConsents.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold text-destructive">{expiredConsents.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opt-Outs Tab */}
          <TabsContent value="optouts">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Opted Out Numbers ({optOuts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {optOuts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No opt-outs recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold">Phone</th>
                          <th className="text-left py-2 px-3 font-semibold">Keyword</th>
                          <th className="text-left py-2 px-3 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optOuts.slice(0, 50).map((opt, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-2 px-3 font-mono text-xs">{opt.phone_number}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline">{opt.opt_out_keyword}</Badge>
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">
                              {new Date(opt.opted_out_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit-log">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SMS Audit Trail (Last {lookbackDays} Days)</CardTitle>
                <CardDescription>All outbound SMS activity with consent status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold">Time</th>
                        <th className="text-left py-2 px-3 font-semibold">Phone</th>
                        <th className="text-left py-2 px-3 font-semibold">Type</th>
                        <th className="text-left py-2 px-3 font-semibold">Status</th>
                        <th className="text-left py-2 px-3 font-semibold">Message Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 50).map((log, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-2 px-3">{new Date(log.sent_at).toLocaleTimeString()}</td>
                          <td className="py-2 px-3 font-mono">{log.phone_number}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-xs">{log.message_type}</Badge>
                          </td>
                          <td className="py-2 px-3">
                            <Badge className={log.status === 'sent' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}>
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 max-w-xs truncate text-muted-foreground">
                            {log.message_body}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Compliance Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {auditReport?.recommendations?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">✓ All systems compliant</p>
                ) : (
                  <div className="space-y-3">
                    {auditReport?.recommendations?.map((rec, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-chart-2 mt-0.5 shrink-0" />
                          <div>
                            <Badge className={rec.priority === 'CRITICAL' ? 'bg-destructive' : 'bg-chart-2'} className="mb-2">
                              {rec.priority}
                            </Badge>
                            <p className="font-medium text-sm">{rec.action}</p>
                            <p className="text-xs text-muted-foreground mt-1">Impact: {rec.impact}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="mt-8 flex justify-end">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Compliance Report
          </Button>
        </div>
      </div>
    </div>
  );
}