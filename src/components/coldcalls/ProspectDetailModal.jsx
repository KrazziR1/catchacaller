import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

const discontinuationReasons = [
  "too_expensive",
  "not_needed",
  "competitor",
  "bad_experience",
  "other",
];

export default function ProspectDetailModal({ prospect, open, onOpenChange }) {
  const [status, setStatus] = useState(prospect?.status || "contacted");
  const [notes, setNotes] = useState(prospect?.notes || "");
  const [reasonCategory, setReasonCategory] = useState(
    prospect?.discontinuation_reason_category || ""
  );
  const [reasonText, setReasonText] = useState(prospect?.discontinuation_reason || "");

  const queryClient = useQueryClient();

  const { data: smsLogs = [] } = useQuery({
    queryKey: ["prospect-sms", prospect?.id],
    queryFn: () => base44.entities.ColdCallSMSLog.filter({ prospect_id: prospect?.id }, "-sent_at", 100),
    enabled: !!prospect?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ColdCallProspect.update(prospect.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-prospects"] });
      toast.success("Prospect updated");
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    const data = {
      status,
      notes,
    };

    if (status === "discontinued_trial") {
      data.discontinuation_reason_category = reasonCategory;
      data.discontinuation_reason = reasonText;
    }

    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prospect?.business_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages ({smsLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 py-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="signed_up_trial">Signed Up (Trial)</SelectItem>
                <SelectItem value="actively_using">Actively Using</SelectItem>
                <SelectItem value="discontinued_trial">Discontinued Trial</SelectItem>
                <SelectItem value="do_not_call">Do Not Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "discontinued_trial" && (
            <>
              <div>
                <Label>Reason Category</Label>
                <Select value={reasonCategory} onValueChange={setReasonCategory}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="too_expensive">Too Expensive</SelectItem>
                    <SelectItem value="not_needed">Not Needed</SelectItem>
                    <SelectItem value="competitor">Chose Competitor</SelectItem>
                    <SelectItem value="bad_experience">Bad Experience</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reasonCategory === "other" && (
                <div>
                  <Label>Please explain</Label>
                  <Textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="Why did they discontinue?"
                    className="mt-1.5"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this prospect..."
              className="mt-1.5 min-h-[120px]"
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/50">
            <p>
              <strong>Phone:</strong> {prospect?.phone_number}
            </p>
            <p>
              <strong>Location:</strong> {prospect?.city}, {prospect?.state}
            </p>
            <p>
              <strong>Industry:</strong> {prospect?.industry}
            </p>
            <p>
              <strong>First Contacted:</strong>{" "}
              {new Date(prospect?.date_contacted).toLocaleDateString()}
            </p>
          </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-3 py-4">
            {smsLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No messages sent yet</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {smsLogs.map((log) => (
                  <div key={log.id} className={`p-3 rounded-lg ${log.direction === 'outbound' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'}`}>
                    <p className="text-xs font-mono text-muted-foreground mb-2">
                      {new Date(log.sent_at).toLocaleString()} • {log.direction === 'outbound' ? 'Sent' : 'Received'}
                    </p>
                    <p className="text-sm leading-relaxed">{log.message_body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{log.status}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}