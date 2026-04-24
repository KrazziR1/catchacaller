import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignmentSelector({ conversation, profile }) {
  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', profile?.id],
    queryFn: () => base44.entities.TeamMember.filter({ account_id: profile?.id }),
    enabled: !!profile?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (email) => base44.entities.Conversation.update(conversation.id, { assigned_to: email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation assigned');
    },
  });

  return (
    <div className="flex items-center gap-2">
      <UserCheck className="w-4 h-4 text-muted-foreground" />
      <Select value={conversation.assigned_to || ''} onValueChange={(v) => updateMutation.mutate(v)}>
        <SelectTrigger className="w-40 h-8 text-xs rounded-lg">
          <SelectValue placeholder="Assign to..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Unassigned</SelectItem>
          {teamMembers.map(member => (
            <SelectItem key={member.id} value={member.user_email}>
              {member.user_email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}