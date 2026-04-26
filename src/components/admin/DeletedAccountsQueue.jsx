import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, ChevronDown, ChevronRight, MessageSquare, RotateCcw, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

function StatusBadge({ status }) {
  const map = {
    pending: "bg-amber-100 text-amber-800",
    reviewed: "bg-blue-100 text-blue-800",
    reinstated: "bg-green-100 text-green-800",
    permanently_closed: "bg-gray-100 text-gray-600",
  };
  return (
    <Badge className={`text-xs capitalize ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status?.replace("_", " ") || "pending"}
    </Badge>
  );
}

function SnapshotRow({ label, value }) {
  if (!value && value !== false) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="font-medium break-all">{String(value)}</span>
    </div>
  );
}

export default function DeletedAccountsQueue() {
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["deleted-accounts-queue"],
    queryFn: () =>
      base44.asServiceRole.entities.AdminAuditLog.filter({ action: "account_deleted" }, "-created_date", 100),
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      base44.asServiceRole.entities.AdminAuditLog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleted-accounts-queue"] });
      toast.success("Review updated");
      setSelectedLog(null);
      setReviewNote("");
    },
    onError: (err) => toast.error(err.message || "Failed to update"),
  });

  const pending = logs.filter((l) => l.review_status === "pending" || !l.review_status);
  const reviewed = logs.filter((l) => l.review_status && l.review_status !== "pending");

  if (isLoading) return null;
  if (logs.length === 0) return null;

  const openLog = (log) => {
    setSelectedLog(log);
    setReviewNote(log.review_note || "");
  };

  const snap = selectedLog?.original_business_snapshot;

  return (
    <>
      <Card className="rounded-2xl border-amber-200 bg-amber-50/30 mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Deleted Account Reviews
              {pending.length > 0 && (
                <Badge className="bg-amber-600 text-white text-xs ml-1">{pending.length} pending</Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-border hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => openLog(log)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{log.target_business || "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.target_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {log.user_requested_review && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs gap-1">
                      <MessageSquare className="w-3 h-3" /> User Requested
                    </Badge>
                  )}
                  <StatusBadge status={log.review_status || "pending"} />
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(log.created_date).toLocaleDateString()}
                  </p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deleted Account: {selectedLog?.target_business}</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 mt-2">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Account Email</p>
                  <p className="font-mono font-medium">{selectedLog.target_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Deleted By</p>
                  <p className="font-mono font-medium">{selectedLog.admin_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Deleted On</p>
                  <p className="font-medium">{new Date(selectedLog.created_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Review Status</p>
                  <StatusBadge status={selectedLog.review_status || "pending"} />
                </div>
              </div>

              {/* Admin deletion reason */}
              {selectedLog.reason && (
                <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5">
                  <p className="text-xs font-semibold text-destructive mb-1">Admin Deletion Reason</p>
                  <p className="text-sm">{selectedLog.reason}</p>
                </div>
              )}

              {/* User review request */}
              {selectedLog.user_requested_review && (
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-800 mb-1">User Submitted Review Request</p>
                  <p className="text-sm text-blue-900">{selectedLog.user_review_message || "No message provided."}</p>
                </div>
              )}

              {/* Original signup snapshot */}
              {snap && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-muted/50 border-b border-border">
                    <p className="text-sm font-semibold">Original Sign-Up Information</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <SnapshotRow label="Business Name" value={snap.business_name} />
                    <SnapshotRow label="Industry" value={snap.industry} />
                    {snap.industry_description && <SnapshotRow label="Industry Description" value={snap.industry_description} />}
                    <SnapshotRow label="Phone Number" value={snap.phone_number} />
                    <SnapshotRow label="Owner Cell" value={snap.owner_phone_number} />
                    <SnapshotRow label="Booking URL" value={snap.booking_url} />
                    <SnapshotRow label="Website" value={snap.website} />
                    <SnapshotRow label="Timezone" value={snap.timezone} />
                    <SnapshotRow label="Business Hours" value={snap.business_hours} />
                    <SnapshotRow label="AI Personality" value={snap.ai_personality} />
                    <SnapshotRow label="High Risk Industry" value={snap.is_high_risk_industry} />
                    <SnapshotRow label="Terms Accepted" value={snap.terms_accepted_at ? new Date(snap.terms_accepted_at).toLocaleString() : null} />
                    <SnapshotRow label="SMS Consent" value={snap.consent_acknowledged_at ? new Date(snap.consent_acknowledged_at).toLocaleString() : null} />
                    <SnapshotRow label="Originally Created" value={snap.created_date ? new Date(snap.created_date).toLocaleString() : null} />
                  </div>
                </div>
              )}

              {/* Review note */}
              <div>
                <label className="text-xs font-semibold block mb-1.5">Internal Review Note</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add an internal note about this case..."
                  className="w-full h-20 px-3 py-2 text-sm rounded-xl border border-input bg-background resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
            <Button
              variant="outline"
              className="gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-50"
              onClick={() => updateMutation.mutate({
                id: selectedLog.id,
                data: { review_status: "reviewed", review_note: reviewNote },
              })}
              disabled={updateMutation.isPending}
            >
              <Eye className="w-4 h-4" /> Mark Reviewed
            </Button>
            <Button
              className="gap-1.5 bg-green-600 hover:bg-green-700"
              onClick={() => updateMutation.mutate({
                id: selectedLog.id,
                data: { review_status: "reinstated", review_note: reviewNote },
              })}
              disabled={updateMutation.isPending}
            >
              <RotateCcw className="w-4 h-4" /> Reinstate
            </Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={() => updateMutation.mutate({
                id: selectedLog.id,
                data: { review_status: "permanently_closed", review_note: reviewNote },
              })}
              disabled={updateMutation.isPending}
            >
              <XCircle className="w-4 h-4" /> Close Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}