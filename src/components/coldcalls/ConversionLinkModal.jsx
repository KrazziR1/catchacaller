import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ConversionLinkModal({ prospect, open, onOpenChange }) {
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const queryClient = useQueryClient();

  const { data: businesses = [] } = useQuery({
    queryKey: ["all-businesses"],
    queryFn: () => base44.entities.BusinessProfile.list("-created_date", 100),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      base44.entities.ColdCallProspect.update(prospect.id, {
        linked_business_profile_id: selectedBusinessId,
        status: "actively_using",
        date_converted: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-prospects"] });
      toast.success("Prospect linked to business");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link to Business Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Linking {prospect?.business_name} to a business profile tracks the conversion journey.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-semibold">Select Business</label>
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a business..." />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!selectedBusinessId || updateMutation.isPending}
          >
            Link Conversion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}