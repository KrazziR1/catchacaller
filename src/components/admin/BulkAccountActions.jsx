import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function BulkAccountActions({ selectedAccounts, onComplete }) {
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: async (actionType) => {
      const user = await base44.auth.me();
      const promises = Array.from(selectedAccounts).map(async (businessId) => {
        // Get business to find owner email
        try {
          const business = await base44.asServiceRole.entities.BusinessProfile.get(businessId);
          if (business) {
            await base44.asServiceRole.entities.BusinessProfile.update(businessId, {
              requires_manual_review: false,
            });
            // Create audit log with correct email
            await base44.asServiceRole.entities.AdminAuditLog.create({
              admin_email: user.email,
              action: actionType === 'approve' ? 'account_approved' : 'account_rejected',
              target_email: business.created_by,
              target_business: business.business_name,
              reason: reason || `Bulk ${actionType}`,
              refund_issued: false
            });
          }
        } catch (e) {
          console.error('Business action failed:', e);
        }
      });
      await Promise.allSettled(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
      toast.success(`${action === 'approve' ? 'Approved' : 'Rejected'} ${selectedAccounts.size} account${selectedAccounts.size > 1 ? 's' : ''}`);
      setAction(null);
      setReason("");
      onComplete();
    },
    onError: (error) => {
      toast.error(error.message || `Failed to ${action} accounts`);
    },
  });

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAction('approve')}
          disabled={selectedAccounts.size === 0}
          className="gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Approve {selectedAccounts.size > 0 && `(${selectedAccounts.size})`}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAction('reject')}
          disabled={selectedAccounts.size === 0}
          className="gap-2"
        >
          <XCircle className="w-4 h-4" />
          Reject {selectedAccounts.size > 0 && `(${selectedAccounts.size})`}
        </Button>
      </div>

      <Dialog open={!!action} onOpenChange={() => action && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve' : 'Reject'} {selectedAccounts.size} Account{selectedAccounts.size > 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a reason (optional)..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button
             onClick={() => actionMutation.mutate(action)}
             disabled={actionMutation.isPending}
             variant={action === 'approve' ? 'default' : 'destructive'}
            >
             {actionMutation.isPending ? (
               <>
                 <span className="inline-block mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                 Processing...
               </>
             ) : (
               `${action === 'approve' ? 'Approve' : 'Reject'} ${selectedAccounts.size} Account${selectedAccounts.size > 1 ? 's' : ''}`
             )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}