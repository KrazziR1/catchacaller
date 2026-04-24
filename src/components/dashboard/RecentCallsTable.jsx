import { Badge } from "@/components/ui/badge";
import { PhoneMissed, MessageSquare, CalendarCheck, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  new: { label: "New", icon: AlertCircle, className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  sms_sent: { label: "SMS Sent", icon: MessageSquare, className: "bg-primary/10 text-primary border-primary/20" },
  replied: { label: "Replied", icon: MessageSquare, className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  booked: { label: "Booked", icon: CalendarCheck, className: "bg-accent/10 text-accent border-accent/20" },
  lost: { label: "Lost", icon: PhoneMissed, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function RecentCallsTable({ calls }) {
  if (!calls || calls.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8">
        <div className="text-center py-8">
          <PhoneMissed className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No missed calls yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Calls will appear here once your system is connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-bold">Recent Missed Calls</h3>
        <span className="text-xs text-muted-foreground">{calls.length} calls</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left px-6 py-3 font-medium">Caller</th>
              <th className="text-left px-6 py-3 font-medium">Time</th>
              <th className="text-left px-6 py-3 font-medium">Response</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-right px-6 py-3 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => {
              const status = statusConfig[call.status] || statusConfig.new;
              const StatusIcon = status.icon;
              return (
                <tr key={call.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm">{call.caller_name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{call.caller_phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {call.call_time ? format(new Date(call.call_time), "MMM d, h:mm a") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {call.response_time_seconds ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="w-3 h-3 text-accent" />
                        <span className="font-mono font-medium">{call.response_time_seconds}s</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`${status.className} border text-xs font-medium`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {call.estimated_value ? (
                      <span className="font-semibold text-sm">${call.estimated_value}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}