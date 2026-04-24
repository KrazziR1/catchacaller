import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationRuleManager({ profile }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    rule_type: 'first_followup',
    name: '',
    is_enabled: true,
    trigger_condition: 'no_response_hours',
    hours_delay: 2,
    sms_template_id: '',
    custom_message: '',
  });

  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['automation-rules', profile?.id],
    queryFn: () => base44.entities.AutomationRule.filter({ business_profile_id: profile?.id }),
    enabled: !!profile?.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.SMSTemplate.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create({ ...data, business_profile_id: profile.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowForm(false);
      resetForm();
      toast.success('Rule created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowForm(false);
      setEditing(null);
      resetForm();
      toast.success('Rule updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Rule deleted');
    },
  });

  const resetForm = () => {
    setForm({
      rule_type: 'first_followup',
      name: '',
      is_enabled: true,
      trigger_condition: 'no_response_hours',
      hours_delay: 2,
      sms_template_id: '',
      custom_message: '',
    });
  };

  const handleSave = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (rule) => {
    setEditing(rule);
    setForm({
      rule_type: rule.rule_type,
      name: rule.name,
      is_enabled: rule.is_enabled,
      trigger_condition: rule.trigger_condition,
      hours_delay: rule.hours_delay || 2,
      sms_template_id: rule.sms_template_id || '',
      custom_message: rule.custom_message || '',
    });
    setShowForm(true);
  };

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle>Automated Follow-ups</CardTitle>
            </div>
            <Button size="sm" onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="rounded-lg">
              <Plus className="w-4 h-4 mr-1" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No automation rules. Create one to auto-send follow-up messages.</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{rule.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rule.trigger_condition === 'no_response_hours'
                      ? `Send after ${rule.hours_delay} hours of no response`
                      : 'Manual trigger'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_enabled}
                    onCheckedChange={(v) => updateMutation.mutate({ id: rule.id, data: { is_enabled: v } })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(rule)} className="h-8 w-8">
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(rule.id)} className="h-8 w-8 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Rule' : 'Create Automation Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rule Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., 2-hour follow-up"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Trigger Condition</Label>
              <Select value={form.trigger_condition} onValueChange={(v) => setForm({ ...form, trigger_condition: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_response_hours">No response after X hours</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.trigger_condition === 'no_response_hours' && (
              <div>
                <Label>Hours to Wait</Label>
                <Input
                  type="number"
                  value={form.hours_delay}
                  onChange={(e) => setForm({ ...form, hours_delay: parseInt(e.target.value) })}
                  className="mt-1.5"
                  min="1"
                />
              </div>
            )}
            <div>
              <Label>Message Source</Label>
              <Select value={form.sms_template_id ? 'template' : 'custom'} onValueChange={(v) => {
                if (v === 'template') {
                  setForm({ ...form, sms_template_id: templates[0]?.id || '', custom_message: '' });
                } else {
                  setForm({ ...form, sms_template_id: '', custom_message: '' });
                }
              }}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">Use SMS Template</SelectItem>
                  <SelectItem value="custom">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.sms_template_id && (
              <div>
                <Label>Select Template</Label>
                <Select value={form.sms_template_id} onValueChange={(v) => setForm({ ...form, sms_template_id: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!form.sms_template_id && (
              <div>
                <Label>Custom Message</Label>
                <Textarea
                  value={form.custom_message}
                  onChange={(e) => setForm({ ...form, custom_message: e.target.value })}
                  placeholder="Hi {caller_name}! Just checking in..."
                  className="mt-1.5"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_enabled} onCheckedChange={(v) => setForm({ ...form, is_enabled: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}