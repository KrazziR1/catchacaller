import { Card } from '@/components/ui/card';
import { AlertCircle, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function CalendarBookingWidget({ user, subscription }) {
  const [upcomingCount, setUpcomingCount] = useState(0);

  const { data: bookings = [] } = useQuery({
    queryKey: ['calendar-bookings'],
    queryFn: () => base44.entities.CalendarBooking.filter({ status: 'scheduled' }),
  });

  useEffect(() => {
    const upcoming = bookings.filter(b => new Date(b.scheduled_time) > new Date()).length;
    setUpcomingCount(upcoming);
  }, [bookings]);

  const isPlanAllowed = subscription?.plan_name === 'Pro';

  if (!isPlanAllowed) {
    return (
      <Card className="rounded-2xl p-6 border-indigo-200 bg-indigo-50">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-indigo-900">Calendar Booking (Pro-only feature)</p>
            <p className="text-xs text-indigo-800 mt-1">Upgrade to Pro plan to enable automated calendar integrations and booking confirmations.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Bookings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{upcomingCount} appointments scheduled</p>
        </div>
      </div>
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">No bookings yet</p>
      ) : (
        <div className="space-y-2 mt-4">
          {bookings.slice(0, 5).map(b => (
            <div key={b.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
              <span>{b.caller_name || b.caller_phone}</span>
              <span className="text-muted-foreground text-xs">{format(new Date(b.scheduled_time), 'MMM d, h:mm a')}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}