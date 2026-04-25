import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, MessageSquare, Edit2, Trash2, Send, Settings, Zap } from "lucide-react";
import { toast } from "sonner";
import BulkSMSDialog from "./BulkSMSDialog";
import EditBusinessDialog from "./EditBusinessDialog";
import ProspectDetailModal from "./ProspectDetailModal";
import ColdCallSMSDialog from "./ColdCallSMSDialog";

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkSMS, setShowBulkSMS] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", message_body: "" });
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

  const { data: templates = [] } = useQuery({
    queryKey: ["cold-call-templates"],
    queryFn: async () => {
      try {
        return await base44.entities.SMSTemplate.filter({ industry: "general" });
      } catch {
        return [];
      }
    },
  });

  const createProspectMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ColdCallProspect.create({
        ...data,
        date_contacted: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-prospects"] });
      setFormData({ business_name: "", phone_number: "", email: "", city: "", state: "", industry: "general" });
      setShowAddForm(false);
      toast.success("Prospect added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add prospect");
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.SMSTemplate.create({
        ...data,
        category: "custom",
        industry: "general",
        is_active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-templates"] });
      setNewTemplate({ name: "", message_body: "" });
      setShowTemplateForm(false);
      toast.success("Template created");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create template");
    },
  });

  const deleteProspectMutation = useMutation({
    mutationFn: (id) => base44.entities.ColdCallProspect.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-prospects"] });
      toast.success("Prospect deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete");
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
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Cold Call Tracking</h1>
          <p className="text-muted-foreground mt-1">Manage prospects, send SMS templates, and track conversions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplateForm(true)}
            className="gap-2 rounded-xl"
          >
            <Settings className="w-4 h-4" />
            Templates
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBulkSMS(true)}
            disabled={prospects.length === 0}
            className="gap-2 rounded-xl"
          >
            <Send className="w-4 h-4" />
            Bulk SMS
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="signed_up_trial">Signed Up (Trial)</SelectItem>
                <SelectItem value="actively_using">Actively Using</SelectItem>
                <SelectItem value="discontinued_trial">Discontinued</SelectItem>
                <SelectItem value="do_not_call">Do Not Call</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="rounded-xl">
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
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prospects Table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>Prospects ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No prospects found. Add one to get started.
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
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((prospect) => (
                    <tr key={prospect.id} className="border-b border-border hover:bg-muted/50 transition-colors">
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
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowEditDialog(true);
                            }}
                            title="Edit business info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowDetailModal(true);
                            }}
                            title="View details & update status"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-destructive"
                            onClick={() => deleteProspectMutation.mutate(prospect.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
              <Label>Business Name *</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="mt-1.5 rounded-lg"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1.5 rounded-lg"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1.5 rounded-lg"
                />
              </div>
              <div>
                <Label>State *</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="NY"
                  maxLength="2"
                  className="mt-1.5 rounded-lg"
                />
              </div>
            </div>
            <div>
              <Label>Industry</Label>
              <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                <SelectTrigger className="mt-1.5 rounded-lg">
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
              onClick={() => createProspectMutation.mutate(formData)}
              disabled={!formData.business_name || !formData.phone_number || !formData.city || !formData.state}
            >
              Add Prospect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create SMS Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Follow-up: Discount Offer"
                className="mt-1.5 rounded-lg"
                autoFocus
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={newTemplate.message_body}
                onChange={(e) => setNewTemplate({ ...newTemplate, message_body: e.target.value })}
                placeholder="Type your SMS template..."
                className="mt-1.5 rounded-lg min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newTemplate.message_body.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTemplateMutation.mutate(newTemplate)}
              disabled={!newTemplate.name || !newTemplate.message_body}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {selectedProspect && (
        <>
          <EditBusinessDialog
            prospect={selectedProspect}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
          <ProspectDetailModal
            prospect={selectedProspect}
            open={showDetailModal}
            onOpenChange={setShowDetailModal}
          />
        </>
      )}

      <BulkSMSDialog
        prospects={prospects}
        templates={templates}
        open={showBulkSMS}
        onOpenChange={setShowBulkSMS}
      />
    </div>
  );
}