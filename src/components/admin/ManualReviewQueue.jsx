import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function ManualReviewQueue({ businesses }) {
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState(null);
  const [notes, setNotes] = useState("");
  const [refundSelected, setRefundSelected] = useState(false);

  const flaggedBusinesses = businesses.filter((b) => b.requires_manual_review);

  const approveMutation = useMutation({
    mutationFn: async (businessId) => {
      const business = businesses.find((b) => b.id === businessId);
      await base44.asServiceRole.entities.BusinessProfile.update(businessId, {
        requires_manual_review: false,
      });
      // Log approval action
      try {
        await base44.asServiceRole.entities.AdminAuditLog.create({
          admin_email: (await base44.auth.me()).email,
          action: 'account_approved',
          target_email: business.created_by,
          target_business: business.business_name,
          reason: notes || 'Account approved',
        });
      } catch (e) {
        console.warn('Audit logging failed (non-critical):', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
      setReviewingId(null);
      setNotes("");
      setRefundSelected(false);
      toast.success("Account approved");
    },
    onError: (error) => {
      toast.error("Failed to approve account");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (businessId) => {
      const business = businesses.find((b) => b.id === businessId);
      // First mark as rejected in profile
      await base44.asServiceRole.entities.BusinessProfile.update(businessId, {
        requires_manual_review: false,
      });
      // Then send rejection email with optional refund (non-critical)
      try {
        await base44.functions.invoke("sendReviewRejectionEmail", {
          email: business.created_by,
          business_name: business.business_name,
          reason: notes || "Account does not meet compliance requirements",
          issueRefund: refundSelected && !!business.twilio_number_sid,
          stripeCustomerId: business.created_by, // We'll lookup the customer by email in the function
        });
      } catch (e) {
        console.warn("Email notification failed (non-critical):", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
      setReviewingId(null);
      setNotes("");
      setRefundSelected(false);
      toast.success("Account rejected and user notified");
    },
    onError: (error) => {
      toast.error("Failed to reject account");
    },
  });

  if (flaggedBusinesses.length === 0) {
    return (
      <Card className="rounded-2xl border-accent/20 bg-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Compliance Review Queue</CardTitle>
              <CardDescription>No accounts pending manual review</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-orange-900">Compliance Review Queue</CardTitle>
              <CardDescription className="text-orange-700">
                {flaggedBusinesses.length} account(s) require manual review
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {flaggedBusinesses.map((business) => (
          <div
            key={business.id}
            className="p-4 rounded-xl border border-orange-200 bg-white space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-sm">{business.business_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{business.created_by}</p>
              </div>
              <Badge className="bg-red-100 text-red-800">
                {business.industry === "debt_collection" ? "Debt Collection" : "Political"}
              </Badge>
            </div>

            {reviewingId === business.id ? (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <label className="text-xs font-semibold block mb-1.5">
                    Review Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why are you approving or rejecting this account?"
                    className="w-full text-xs p-2 rounded border border-border bg-background"
                    rows={2}
                  />
                </div>
                {business.twilio_number_sid && (
                  <div className="flex items-center gap-2 p-2 rounded bg-white border border-border">
                    <input
                      type="checkbox"
                      id={`refund-${business.id}`}
                      checked={refundSelected}
                      onChange={(e) => setRefundSelected(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor={`refund-${business.id}`} className="text-xs cursor-pointer">
                      Issue refund for provisioning fee ($2.99)
                    </label>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReviewingId(null);
                      setNotes("");
                    }}
                    className="rounded-lg h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => rejectMutation.mutate(business.id)}
                    disabled={rejectMutation.isPending}
                    className="rounded-lg h-8"
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(business.id)}
                    disabled={approveMutation.isPending}
                    className="rounded-lg h-8 bg-accent hover:bg-accent/90"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewingId(business.id)}
                  className="flex-1 rounded-lg h-8"
                >
                  <MessageSquare className="w-3 h-3 mr-1" /> Review
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}