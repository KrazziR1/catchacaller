import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function AssignmentBulkAction({ selectedConversations, onComplete }) {
  const [assignTo, setAssignTo] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
    base44.entities.BusinessProfile.list("-created_date", 1).then(async (profiles) => {
      if (profiles[0]) {
        const members = await base44.entities.TeamMember.filter({ account_id: profiles[0].id });
        setTeamMembers(members);
      }
    });
  }, []);

  const bulkAssignMutation = useMutation({
    mutationFn: async (email) => {
      const updates = selectedConversations.map((convId) =>
        base44.entities.Conversation.update(convId, { assigned_to: email })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setAssignTo("");
      onComplete?.();
    },
  });

  const handleBulkAssign = () => {
    if (assignTo) {
      bulkAssignMutation.mutate(assignTo);
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="text-xs font-semibold text-muted-foreground block mb-1">
          Assign {selectedConversations.length} selected to:
        </label>
        <Select value={assignTo} onValueChange={setAssignTo}>
          <SelectTrigger className="h-9 text-sm rounded-lg">
            <SelectValue placeholder="Choose team member..." />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.user_email}>
                {member.user_email}
              </SelectItem>
            ))}
            {user && (
              <SelectItem value={user.email}>
                Me
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleBulkAssign}
        disabled={!assignTo || bulkAssignMutation.isPending}
        size="sm"
        className="h-9 rounded-lg"
      >
        {bulkAssignMutation.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin mr-2" />
        ) : null}
        Assign
      </Button>
    </div>
  );
}