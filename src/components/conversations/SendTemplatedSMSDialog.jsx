import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function SendTemplatedSMSDialog({ open, onOpenChange, conversationIds = [], singleConversation = null }) {
  const [templateId, setTemplateId] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.SMSTemplate.list('-created_date', 100),
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      const payload = singleConversation
        ? { conversation_id: singleConversation.id, template_id: templateId }
        : { conversation_ids: conversationIds, template_id: templateId };
      return base44.functions.invoke('sendTemplatedSMS', payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`SMS sent to ${result.data.results.length} recipient(s)`);
      onOpenChange(false);
      setTemplateId('');
    },
    onError: (error) => {
      toast.error('Failed to send SMS: ' + error.message);
    },
  });

  const activeTemplates = templates.filter(t => t.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Send SMS
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label>Select Template</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger className="mt-2 rounded-lg">
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {activeTemplates.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">No active templates</div>
              ) : (
                activeTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {templateId && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Preview:</p>
              <p className="text-sm text-foreground">
                {templates.find(t => t.id === templateId)?.message_body}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!templateId || sendMutation.isPending}
          >
            Send SMS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}