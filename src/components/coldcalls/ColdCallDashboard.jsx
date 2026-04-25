import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, MessageSquare, Edit2, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import ColdCallSMSDialog from "./ColdCallSMSDialog";
import ProspectDetailModal from "./ProspectDetailModal";

const statusColors = {
  contacted: "bg-blue-100 text-blue-800",
  interested: "bg-yellow-100 text-yellow-800",
  not_interested: "bg-red-100 text-red-800",
  signed_up_trial: "bg-purple-100 text-purple-800",
  actively_using: "bg-green-100 text-green-800",
  discontinued_trial: "bg-orange-100 text-orange-800",
  do_not_call: "bg-gray-100 text-gray-800",
};

export default function ColdCallDashboard() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterCity, setFilterCity] = useState("");
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    phone_number: "",
    email: "",
    city: "",
    state: "",
    industry: "general",
  });

  const queryClient = useQueryClient();

  const { data: prospects = [] } = useQuery({
    queryKey: ["cold-call-prospects"],
    queryFn: () => base44.entities.ColdCallProspect.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ColdCallProspect.create({
      ...data,
      date_contacted: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-prospects"] });
      setFormData({ business_name: "", phone_number: "", email: "", city: "", state: "", industry: "general" });
      setShowAddForm(false);
      toast.success("Prospect added");
    },
  });

  const deleteProspectMutation = useMutation({
    mutationFn: (id) => base44.entities.ColdCallProspect.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-prospects"] });
      toast.success("Prospect deleted");
    },
  });

  const filtered = prospects.filter((p) => {
    const matchesSearch =
      p.business_name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone_number.includes(search);
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesState = filterState === "all" || p.state === filterState;
    const matchesCity = !filterCity || p.city.toLowerCase().includes(filterCity.toLowerCase());
    return matchesSearch && matchesStatus && matchesState && matchesCity;
  });

  const states = [...new Set(prospects.map((p) => p.state))].sort();

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Cold Call Tracking</h1>
          <p className="text-muted-foreground mt-1">Manage prospects and track conversion funnel</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Prospect
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
            <SelectItem value="signed_up_trial">Signed Up (Trial)</SelectItem>
            <SelectItem value="actively_using">Actively Using</SelectItem>
            <SelectItem value="discontinued_trial">Discontinued Trial</SelectItem>
            <SelectItem value="do_not_call">Do Not Call</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger>
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by city..."
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        />
      </div>

      {/* Prospects Table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No prospects found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Business</th>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">Location</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Industry</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((prospect) => (
                    <tr key={prospect.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <p className="font-medium">{prospect.business_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs">{prospect.phone_number}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-muted-foreground">
                          {prospect.city}, {prospect.state}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[prospect.status]}>
                          {prospect.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs capitalize">{prospect.industry}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowDetailModal(true);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowSMSDialog(true);
                            }}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteProspectMutation.mutate(prospect.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Prospect Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Prospect</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Business Name</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="NY"
                  maxLength="2"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Industry</Label>
              <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.business_name || !formData.phone_number}
            >
              Add Prospect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedProspect && (
        <>
          <ProspectDetailModal
            prospect={selectedProspect}
            open={showDetailModal}
            onOpenChange={setShowDetailModal}
          />
          <ColdCallSMSDialog
            prospect={selectedProspect}
            open={showSMSDialog}
            onOpenChange={setShowSMSDialog}
          />
        </>
      )}
    </div>
  );
}