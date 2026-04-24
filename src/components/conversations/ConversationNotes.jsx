import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ConversationNotes({ conversation, user }) {
  const [showAdd, setShowAdd] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ['conversation-notes', conversation.id],
    queryFn: () => base44.entities.ConversationNote.filter({ conversation_id: conversation.id }),
    enabled: !!conversation.id,
  });

  const addMutation = useMutation({
    mutationFn: (content) => base44.entities.ConversationNote.create({
      conversation_id: conversation.id,
      author_email: user.email,
      content,
      is_internal: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-notes'] });
      setNoteContent('');
      setShowAdd(false);
      toast.success('Note added');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ConversationNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversation-notes'] }),
  });

  return (
    <Card className="p-4 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Team Notes
        </h4>
        <Button onClick={() => setShowAdd(true)} size="sm" variant="outline" className="rounded-lg h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Add Note
        </Button>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No notes yet</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="p-3 bg-muted rounded-lg text-xs">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium">{note.author_email}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-5 h-5 text-destructive"
                  onClick={() => deleteMutation.mutate(note.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-muted-foreground">{note.content}</p>
              <p className="text-muted-foreground/60 mt-1">{format(new Date(note.created_date), 'MMM d, h:mm a')}</p>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add an internal note..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate(noteContent)}
              disabled={!noteContent.trim() || addMutation.isPending}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}