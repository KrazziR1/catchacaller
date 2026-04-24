import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar } from 'lucide-react';

export default function CalendarSyncDialog({ booking, open, onOpenChange }) {
  const syncMutation = useMutation({
    mutationFn: async () => {
      // This would integrate with Calendly/Google Calendar API
      // For now, just show the booking details
      return { status: 'synced', booking_id: booking?.id };
    },
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Sync to Calendar
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              Connect your Calendly or Google Calendar account in Settings to enable automatic syncing.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Caller:</span> {booking.caller_name}</p>
            <p><span className="font-medium">Time:</span> {new Date(booking.scheduled_time).toLocaleString()}</p>
            <p><span className="font-medium">Duration:</span> {booking.duration_minutes} min</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}