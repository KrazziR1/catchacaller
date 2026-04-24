import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamManagement({ profile, subscription, user }) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const queryClient = useQueryClient();

  const isGrowthPlus = subscription?.plan_name && ['Growth', 'Pro'].includes(subscription.plan_name);
  const isAdmin = user?.role === 'admin';

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', profile?.id],
    queryFn: () => base44.entities.TeamMember.filter({ account_id: profile?.id }),
    enabled: !!profile?.id,
  });

  const inviteMutation = useMutation({
    mutationFn: async (email) => {
      await base44.entities.TeamMember.create({
        user_email: email,
        account_id: profile.id,
        role: inviteRole,
        joined_at: new Date().toISOString(),
      });
      await base44.users.inviteUser(email, inviteRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setInviteEmail('');
      setInviteRole('member');
      setShowInvite(false);
      toast.success('Team member invited');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to invite team member');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => base44.entities.TeamMember.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Team member removed');
    },
  });

  if (!isGrowthPlus) {
    return (
      <Card className="rounded-2xl p-6 border-blue-200 bg-blue-50">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-blue-900">Team Collaboration (Growth+ feature)</p>
            <p className="text-xs text-blue-800 mt-1">Upgrade to Growth or Pro plan to add team members and assign conversations.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Team Members</h3>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)} size="sm" className="rounded-lg">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Member
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {teamMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet</p>
        ) : (
          teamMembers.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">{member.user_email}</p>
                <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
              </div>
              {isAdmin && member.user_email !== user.email && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-destructive hover:text-destructive"
                  onClick={() => removeMutation.mutate(member.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email Address</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="team@example.com"
                type="email"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Team Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button
              onClick={() => inviteMutation.mutate(inviteEmail)}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}