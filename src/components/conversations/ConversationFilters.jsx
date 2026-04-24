import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';
import { differenceInHours } from 'date-fns';

export default function ConversationFilters({
  search,
  onSearchChange,
  selectedStage,
  onStageChange,
  selectedTeamMember,
  onTeamMemberChange,
  selectedUrgency,
  onUrgencyChange,
  dateRange,
  onDateRangeChange,
  teamMembers,
  onClear,
}) {
  const hasActiveFilters = selectedStage || selectedTeamMember || selectedUrgency || dateRange.from;

  return (
    <div className="space-y-3 p-4 border-b border-border">
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg text-sm"
        />
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 gap-2">
        <Select value={selectedStage || ''} onValueChange={onStageChange}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Stages</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedUrgency || ''} onValueChange={onUrgencyChange}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="All Urgency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Urgency</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>

        {teamMembers.length > 0 && (
          <Select value={selectedTeamMember || ''} onValueChange={onTeamMemberChange}>
            <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="All Team" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Team Members</SelectItem>
              {teamMembers.map(m => (
                <SelectItem key={m.id} value={m.user_email}>{m.user_email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex gap-1">
          <Input
            type="date"
            value={dateRange.from || ''}
            onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
            className="h-8 text-xs rounded-lg"
          />
          {hasActiveFilters && (
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={onClear}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}