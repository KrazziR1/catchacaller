import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Pencil, Trash2, MessageSquare, Sparkles, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import TemplateLibrary from "@/components/templates/TemplateLibrary";

const categoryLabels = {
  initial_response: "Initial Response",
  follow_up: "Follow-up",
  booking: "Booking",
  qualification: "Qualification",
  custom: "Custom",
};

const defaultTemplate = {
  name: "",
  category: "initial_response",
  message_body: "",
  industry: "general",
  is_active: true,
  send_delay_seconds: 0,
};

export default function Templates() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState(defaultTemplate);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => base44.entities.SMSTemplate.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SMSTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SMSTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SMSTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });

  const openCreate = () => {
    setEditingTemplate(null);
    setFormData(defaultTemplate);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditingTemplate(t);
    setFormData({
      name: t.name || "",
      category: t.category || "initial_response",
      message_body: t.message_body || "",
      industry: t.industry || "hvac",
      is_active: t.is_active !== false,
      send_delay_seconds: t.send_delay_seconds || 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData(defaultTemplate);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleUseTemplate = (template) => {
    setFormData({
      name: template.name + " (Copy)",
      category: template.category,
      message_body: template.message_body,
      industry: template.industry,
      is_active: true,
      send_delay_seconds: 0,
    });
    setEditingTemplate(null);
    setShowForm(true);
    toast.success("Template loaded");
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">SMS Templates</h1>
          <p className="text-muted-foreground mt-1">Manage your automated message templates</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="mb-8">
        <TabsList className="grid w-full max-w-sm">
          <TabsTrigger value="templates">Your Templates</TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-semibold text-muted-foreground">No templates yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Create your first SMS template to get started</p>
              <Button onClick={openCreate} variant="outline" className="mt-4 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{t.name}</h3>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {categoryLabels[t.category] || t.category}
                        </Badge>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${t.is_active !== false ? "bg-accent" : "bg-muted-foreground/30"}`} />
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {t.message_body}
                  </p>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">
                      {t.industry?.toUpperCase()}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <TemplateLibrary onUseTemplate={handleUseTemplate} />
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Initial Response"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial_response">Initial Response</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="qualification">Qualification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General / Other</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="roofing">Roofing</SelectItem>
                    <SelectItem value="med_spa">Med Spa / Aesthetics</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="marketing">Marketing / Agency</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="dental">Dental / Healthcare</SelectItem>
                    <SelectItem value="fitness">Fitness / Wellness</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Message Body</Label>
              <Textarea
                value={formData.message_body}
                onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
                placeholder="Hi {caller_name}! Sorry we missed your call at {business_name}..."
                className="mt-1.5 min-h-[120px]"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Placeholders: {"{business_name}"}, {"{caller_name}"}, {"{booking_url}"}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.message_body}>
              {editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}