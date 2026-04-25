import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

export default function SMSMetrics({ conversations }) {
  const totalConversations = conversations.length;
  const withResponses = conversations.filter((c) => c.messages?.some((m) => m.sender === "lead")).length;
  const responseRate = totalConversations > 0 ? ((withResponses / totalConversations) * 100).toFixed(1) : 0;

  const avgResponseTime = conversations.reduce((sum, c) => {
    const aiMsg = c.messages?.find((m) => m.sender === "ai");
    const leadMsg = c.messages?.find((m) => m.sender === "lead");
    if (aiMsg && leadMsg) {
      const time = new Date(leadMsg.timestamp) - new Date(aiMsg.timestamp);
      return sum + (time > 0 ? time / 1000 : 0); // seconds
    }
    return sum;
  }, 0);
  const avgTime = conversations.filter((c) => {
    const aiMsg = c.messages?.find((m) => m.sender === "ai");
    const leadMsg = c.messages?.find((m) => m.sender === "lead");
    return aiMsg && leadMsg && new Date(leadMsg.timestamp) > new Date(aiMsg.timestamp);
  }).length;

  const avgResponseSeconds = avgTime > 0 ? Math.round(avgResponseTime / avgTime) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Total Conversations</CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalConversations}</p>
          <p className="text-xs text-muted-foreground mt-1">Started conversations</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Response Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{responseRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Leads replied to AI</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Avg Reply Time</CardTitle>
            <Clock className="w-4 h-4 text-chart-2" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{avgResponseSeconds}s</p>
          <p className="text-xs text-muted-foreground mt-1">Lead response speed</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Booking Rate</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-chart-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {totalConversations > 0
              ? ((conversations.filter((c) => c.status === "booked").length / totalConversations) * 100).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground mt-1">Conversations to bookings</p>
        </CardContent>
      </Card>
    </div>
  );
}