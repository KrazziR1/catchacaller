import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { processBatchWithConcurrency } from "@/lib/rateLimitBulkSMS";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BulkSMSDialog({ prospects, templates, open, onOpenChange }) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [editedMessage, setEditedMessage] = useState("");
  const [selectedProspects, setSelectedProspects] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      setEditedMessage(template.message_body);
    }
  }, [selectedTemplate, templates]);

  const handleProspectToggle = (id) => {
    const newSet = new Set(selectedProspects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProspects(newSet);
  };

  const handleSelectAll = () => {
    if (selectedProspects.size === prospects.length) {
      setSelectedProspects(new Set());
    } else {
      setSelectedProspects(new Set(prospects.map(p => p.id)));
    }
  };

  const sendBulkMutation = useMutation({
    mutationFn: async () => {
      const prospectIds = Array.from(selectedProspects);
      
      // Process in batches of 5 to avoid Twilio rate limits
      const results = await processBatchWithConcurrency(
        prospectIds,
        (prospectId) => {
          const prospect = prospects.find(p => p.id === prospectId);
          return base44.functions.invoke("sendColdCallSMSWithCompliance", {
            prospect_id: prospectId,
            phone_number: prospect.phone_number,
            message_body: editedMessage,
          });
        },
        5
      );
      
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`Failed to send to ${failed.length}/${selectedProspects.size} prospects`);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-sms"] });
      queryClient.invalidateQueries({ queryKey: ["cold-call-prospects"] });
      toast.success(`SMS sent to ${selectedProspects.size} prospects`);
      setSelectedProspects(new Set());
      setSelectedTemplate("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send bulk SMS");
    },
  });

  const handleSend = async () => {
    if (!editedMessage.trim() || selectedProspects.size === 0) {
      toast.error("Edit the message and select at least one prospect");
      return;
    }

    // Filter out DNC prospects
    const dncProspects = prospects.filter(p => 
      p.is_dnc_flagged || p.status === 'do_not_call' || selectedProspects.has(p.id)
    ).filter(p => selectedProspects.has(p.id));

    if (dncProspects.length > 0) {
      const filtered = dncProspects.filter(p => !p.is_dnc_flagged && p.status !== 'do_not_call');
      setSelectedProspects(new Set(filtered.map(p => p.id)));
      toast.warning(`Removed ${dncProspects.length} DNC/opted-out prospects`);
      return;
    }

    setIsSending(true);
    try {
      await sendBulkMutation.mutateAsync();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Bulk SMS</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1">
          {/* Template Selection */}
          <div>
            <Label>Select Template (optional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a template to start..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Editable Message */}
          <div>
            <Label>Message to Send</Label>
            <Textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              placeholder="Edit or type your message here..."
              className="mt-1.5 min-h-[120px] rounded-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedMessage.length} characters
            </p>
          </div>

          {/* Prospects Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Select Prospects ({selectedProspects.size})</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedProspects.size === prospects.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3">
              {prospects.map(prospect => (
                <div key={prospect.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                  <Checkbox
                    checked={selectedProspects.has(prospect.id)}
                    onCheckedChange={() => handleProspectToggle(prospect.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prospect.business_name}</p>
                    <p className="text-xs text-muted-foreground">{prospect.phone_number}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !editedMessage.trim() || selectedProspects.size === 0}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {selectedProspects.size}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}