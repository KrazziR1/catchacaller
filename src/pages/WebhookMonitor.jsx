import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageSquare, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const eventConfig = {
  missed_call: { icon: Phone, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Missed Call' },
  sms_sent: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', label: 'SMS Sent' },
  conversation_started: { icon: Activity, color: 'text-accent', bg: 'bg-accent/10', label: 'Conversation' },
};

export default function WebhookMonitor() {
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState([]);

  const { data: calls = [] } = useQuery({
    queryKey: ['missed-calls'],
    queryFn: () => base44.entities.MissedCall.list('-call_time', 50),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 50),
  });

  useEffect(() => {
    const allEvents = [];

    calls.forEach(call => {
      allEvents.push({
        id: `call-${call.id}`,
        type: 'missed_call',
        timestamp: call.call_time,
        data: { phone: call.caller_phone, name: call.caller_name },
        status: call.status,
      });

      if (call.sms_sent_at) {
        allEvents.push({
          id: `sms-${call.id}`,
          type: 'sms_sent',
          timestamp: call.sms_sent_at,
          data: { phone: call.caller_phone, responseTime: call.response_time_seconds },
          status: 'success',
        });
      }
    });

    conversations.forEach(conv => {
      allEvents.push({
        id: `conv-${conv.id}`,
        type: 'conversation_started',
        timestamp: conv.created_date,
        data: { phone: conv.caller_phone, name: conv.caller_name },
        status: conv.status,
      });
    });

    allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setEvents(allEvents.slice(0, 50));
  }, [calls, conversations]);

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Webhook Monitor</h1>
        <p className="text-muted-foreground mt-1">Real-time activity from your Twilio integration</p>
      </div>

      <div className="mb-6">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="missed_call">Missed Calls</SelectItem>
            <SelectItem value="sms_sent">SMS Sent</SelectItem>
            <SelectItem value="conversation_started">Conversations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl">
          <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">No events yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const cfg = eventConfig[event.type] || eventConfig.missed_call;
            const Icon = cfg.icon;

            return (
              <Card key={event.id} className="rounded-2xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{cfg.label}</p>
                      <Badge variant="outline" className="text-xs">
                        {event.data.phone || 'N/A'}
                      </Badge>
                      {event.data.name && (
                        <span className="text-xs text-muted-foreground">{event.data.name}</span>
                      )}
                    </div>
                    {event.data.responseTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Response time: {event.data.responseTime}s
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                      {event.status === 'success' || event.status === 'sms_sent' ? (
                        <CheckCircle2 className="w-3 h-3 text-accent" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          event.status === 'success' || event.status === 'sms_sent'
                            ? 'bg-accent/10 text-accent border-accent/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}