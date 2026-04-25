import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Zap, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function ABTestManager({ templateId }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: template } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => base44.entities.SMSTemplate.get(templateId),
    enabled: !!templateId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.SMSTemplate.update(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
      toast.success("A/B test updated");
    },
  });

  if (!template) return null;

  const variantARate = template.ab_test_results?.variant_a_sent
    ? ((template.ab_test_results.variant_a_responses || 0) / template.ab_test_results.variant_a_sent * 100).toFixed(1)
    : 0;

  const variantBRate = template.ab_test_results?.variant_b_sent
    ? ((template.ab_test_results.variant_b_responses || 0) / template.ab_test_results.variant_b_sent * 100).toFixed(1)
    : 0;

  const winner = variantARate > variantBRate ? "A" : "B";

  return (
    <>
      <Card className="rounded-2xl border-accent/30 bg-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            A/B Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!template.ab_test_active ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
              className="w-full gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Start A/B Test
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900">Variant A</p>
                  <p className="text-blue-700 mt-1">{variantARate}% response</p>
                  <p className="text-blue-600 text-xs">{template.ab_test_results?.variant_a_sent} sent</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-semibold text-purple-900">Variant B</p>
                  <p className="text-purple-700 mt-1">{variantBRate}% response</p>
                  <p className="text-purple-600 text-xs">{template.ab_test_results?.variant_b_sent} sent</p>
                </div>
              </div>
              {variantARate > 0 && variantBRate > 0 && (
                <Badge className={winner === "A" ? "bg-blue-600" : "bg-purple-600"}>
                  {winner === "A" ? "Variant A" : "Variant B"} winning ({Math.abs(variantARate - variantBRate).toFixed(1)}% difference)
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateMutation.mutate({ ab_test_active: false })}
                className="w-full"
              >
                End Test
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start A/B Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Variant A</label>
              <Textarea
                value={template.variant_a || template.message_body}
                readOnly
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Variant B (New)</label>
              <Textarea
                defaultValue={template.message_body}
                placeholder="Enter variant B text..."
                className="mt-1 min-h-[80px]"
                id="variantB"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const variantB = document.getElementById("variantB")?.value;
                if (variantB) {
                  updateMutation.mutate({
                    ab_test_active: true,
                    variant_a: template.message_body,
                    variant_b: variantB,
                    ab_test_results: {
                      variant_a_sent: 0,
                      variant_a_responses: 0,
                      variant_b_sent: 0,
                      variant_b_responses: 0,
                    }
                  });
                  setOpen(false);
                }
              }}
            >
              Start Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}