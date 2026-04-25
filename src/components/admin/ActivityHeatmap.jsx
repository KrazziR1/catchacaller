import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export default function ActivityHeatmap({ businesses, missedCalls }) {
  const getActivityStatus = (business) => {
    const calls = missedCalls.filter((c) => c.created_by === business.created_by);
    if (calls.length === 0) return { status: "inactive", days: null };

    const lastCall = calls.sort((a, b) => new Date(b.call_time) - new Date(a.call_time))[0];
    const daysSince = Math.floor(
      (Date.now() - new Date(lastCall.call_time).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince === 0) return { status: "active", days: "Today" };
    if (daysSince === 1) return { status: "active", days: "Yesterday" };
    if (daysSince <= 7) return { status: "active", days: `${daysSince}d ago` };
    if (daysSince <= 30) return { status: "dormant", days: `${Math.floor(daysSince / 7)}w ago` };
    return { status: "inactive", days: `${Math.floor(daysSince / 30)}mo ago` };
  };

  const active = businesses.filter((b) => getActivityStatus(b).status === "active").length;
  const dormant = businesses.filter((b) => getActivityStatus(b).status === "dormant").length;
  const inactive = businesses.filter((b) => getActivityStatus(b).status === "inactive").length;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" /> Activity Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground">Active (This Month)</p>
            <p className="text-2xl font-bold text-accent mt-1">{active}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dormant (1-30 days)</p>
            <p className="text-2xl font-bold text-chart-2 mt-1">{dormant}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inactive (30+ days)</p>
            <p className="text-2xl font-bold text-muted-foreground mt-1">{inactive}</p>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {businesses
            .map((b) => ({ business: b, ...getActivityStatus(b) }))
            .sort((a, b) => {
              const order = { active: 0, dormant: 1, inactive: 2 };
              return order[a.status] - order[b.status];
            })
            .map((item) => (
              <div key={item.business.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <p className="font-medium truncate">{item.business.business_name}</p>
                <Badge
                  className={
                    item.status === "active"
                      ? "bg-accent/20 text-accent"
                      : item.status === "dormant"
                      ? "bg-chart-2/20 text-chart-2"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {item.days || "Never"}
                </Badge>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}