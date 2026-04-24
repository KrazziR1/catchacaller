import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateBookingDialog({ conversation, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    caller_name: conversation.caller_name || '',
    caller_phone: conversation.caller_phone || '',
    scheduled_time: '',
    duration_minutes: 30,
    service_type: conversation.service_type || '',
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarBooking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setFormData({
        caller_name: '',
        caller_phone: '',
        scheduled_time: '',
        duration_minutes: 30,
        service_type: '',
      });
      onOpenChange(false);
      toast.success('Booking created');
    },
  });

  const handleCreate = () => {
    if (!formData.scheduled_time) {
      toast.error('Please select a date and time');
      return;
    }
    createMutation.mutate({
      ...formData,
      conversation_id: conversation.id,
      status: 'scheduled',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Caller Name</Label>
            <Input
              value={formData.caller_name}
              onChange={(e) => setFormData({ ...formData, caller_name: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input
              value={formData.caller_phone}
              onChange={(e) => setFormData({ ...formData, caller_phone: e.target.value })}
              className="mt-1.5"
              disabled
            />
          </div>
          <div>
            <Label>Service Type</Label>
            <Input
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              placeholder="e.g., HVAC Repair"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration (minutes)
            </Label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            Create Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}