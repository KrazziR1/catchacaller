import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function EditBusinessDialog({ prospect, open, onOpenChange }) {
  const [form, setForm] = useState({
    business_name: "",
    phone_number: "",
    email: "",
    city: "",
    state: "",
    industry: "general",
    notes: "",
  });

  useEffect(() => {
    if (prospect) {
      setForm({
        business_name: prospect.business_name || "",
        phone_number: prospect.phone_number || "",
        email: prospect.email || "",
        city: prospect.city || "",
        state: prospect.state || "",
        industry: prospect.industry || "general",
        notes: prospect.notes || "",
      });
    }
  }, [prospect, open]);

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () =>
      base44.entities.ColdCallProspect.update(prospect.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-prospects"] });
      toast.success("Business updated");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update");
    },
  });

  const handleSave = () => {
    if (!form.business_name || !form.phone_number || !form.city || !form.state) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Business</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Business Name *</Label>
            <Input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City *</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>State *</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                maxLength="2"
                placeholder="NY"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="med_spa">Med Spa</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="real_estate">Real Estate</SelectItem>
                <SelectItem value="dental">Dental</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes about this prospect..."
              className="mt-1.5 min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}