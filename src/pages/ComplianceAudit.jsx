import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComplianceAudit() {
  const [searchPhone, setSearchPhone] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: logs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => base44.entities.SMSAuditLog.list("-sent_at", 1000),
    staleTime: 2 * 60 * 1000,
  });

  const filteredLogs = logs.filter(log => {
    const matchesPhone = log.phone_number.includes(searchPhone.replace(/\D/g, ''));
    const matchesType = filterType === "all" || log.message_type === filterType;
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    return matchesPhone && matchesType && matchesStatus;
  });

  const statusColors = {
    sent: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    bounced: "bg-orange-100 text-orange-800",
  };

  const handleExport = () => {
    const csv = [
      ["Phone", "Date", "Type", "Status", "Consent", "Message"],
      ...filteredLogs.map(log => [
        log.phone_number,
        new Date(log.sent_at).toLocaleString(),
        log.message_type,
        log.status,
        log.consent_type,
        log.message_body.substring(0, 50),
      ]),
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sms-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Compliance Audit Trail</h1>
            <p className="text-muted-foreground mt-1">TCPA-compliant SMS history with consent tracking</p>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl mb-6">
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search Phone</label>
              <Input
                placeholder="555-123-4567"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="mt-1.5 h-10 rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-1.5 h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="auto_response">Auto Response</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1.5 h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} variant="outline" className="w-full h-10 rounded-lg">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>SMS Log ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No SMS logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">Date & Time</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Consent</th>
                    <th className="text-left py-3 px-4 font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{log.phone_number}</td>
                      <td className="py-3 px-4 text-xs">
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {log.message_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`text-xs capitalize ${statusColors[log.status] || "bg-gray-100"}`}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {log.consent_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-xs text-muted-foreground truncate">
                        {log.message_body}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Compliance Note:</strong> All SMS sent through CatchACaller are logged here with consent type (called your business = TCPA-compliant). Recipients can opt out by replying STOP. Keep this audit trail for regulatory compliance.
        </p>
      </div>
    </div>
  );
}