import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, Loader2 } from "lucide-react";

export default function AssignmentSelector({ conversation, profile, onAssignmentChange }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members", profile?.id],
    queryFn: () => base44.entities.TeamMember.filter({ account_id: profile?.id }),
    enabled: !!profile?.id,
  });

  const assignMutation = useMutation({
    mutationFn: (assignedTo) =>
      base44.entities.Conversation.update(conversation.id, { assigned_to: assignedTo }),
    onSuccess: (updated) => {
      onAssignmentChange(updated);
    },
  });

  const handleAssign = (email) => {
    if (email === "unassigned") {
      assignMutation.mutate(null);
    } else {
      assignMutation.mutate(email);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground">Assign to Team</label>
      <div className="flex gap-2">
        <Select value={conversation.assigned_to || ""} onValueChange={handleAssign}>
          <SelectTrigger className="h-9 text-sm rounded-lg">
            <SelectValue placeholder="Select team member..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.user_email}>
                {member.user_email.split("@")[0]}
              </SelectItem>
            ))}
            {user && (
              <SelectItem value={user.email}>
                Me ({user.full_name})
              </SelectItem>
            )}
          </SelectContent>
        </Select>

      </div>
    </div>
  );
}