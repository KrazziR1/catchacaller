import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckSquare, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ConversationBulkActions({ selectedIds, onClear, profiles, teamMembers }) {
  const [action, setAction] = useState(null);
  const [targetValue, setTargetValue] = useState('');
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = selectedIds.map(id =>
        base44.entities.Conversation.update(id, updates)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`Updated ${selectedIds.length} conversations`);
      onClear();
      setAction(null);
    },
  });

  const handleBulkStage = () => {
    if (!targetValue) return;
    bulkUpdateMutation.mutate({ pipeline_stage: targetValue });
  };

  const handleBulkAssign = () => {
    if (!targetValue) return;
    bulkUpdateMutation.mutate({ assigned_to: targetValue });
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="p-3 bg-muted/50 border-b border-border flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-muted-foreground">{selectedIds.length} selected</span>

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs rounded-lg"
        onClick={() => setAction('stage')}
      >
        Change Stage
      </Button>

      {teamMembers.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs rounded-lg"
          onClick={() => setAction('assign')}
        >
          Assign to
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs rounded-lg text-destructive"
        onClick={() => setAction('delete')}
      >
        Delete All
      </Button>

      <Dialog open={!!action} onOpenChange={() => setAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {action === 'stage' && 'Change Pipeline Stage'}
              {action === 'assign' && 'Assign to Team Member'}
              {action === 'delete' && 'Delete Conversations'}
            </DialogTitle>
          </DialogHeader>

          {action === 'delete' && (
            <div className="flex gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Delete {selectedIds.length} conversation(s)? This cannot be undone.
              </p>
            </div>
          )}

          {(action === 'stage' || action === 'assign') && (
            <div className="py-4">
              <Select value={targetValue} onValueChange={setTargetValue}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder={action === 'stage' ? 'Select stage...' : 'Select team member...'} />
                </SelectTrigger>
                <SelectContent>
                  {action === 'stage' ? (
                    <>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.user_email}>{m.user_email.split('@')[0]}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (action === 'stage') handleBulkStage();
                if (action === 'assign') handleBulkAssign();
                if (action === 'delete') {
                  bulkUpdateMutation.mutate({ status: 'lost' });
                }
              }}
              disabled={bulkUpdateMutation.isPending || (action !== 'delete' && !targetValue)}
              variant={action === 'delete' ? 'destructive' : 'default'}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}