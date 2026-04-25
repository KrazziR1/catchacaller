import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export default function ConversionChart() {
  const { data: calls = [] } = useQuery({
    queryKey: ["missed-calls"],
    queryFn: () => base44.entities.MissedCall.list("-call_time", 200),
  });

  // Build last 7 days buckets from real data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayCalls = calls.filter((c) => {
      const t = new Date(c.call_time);
      return t >= dayStart && t < dayEnd;
    });
    return {
      day: format(day, "EEE"),
      calls: dayCalls.length,
      recovered: dayCalls.filter((c) => ["replied", "booked"].includes(c.status)).length,
      booked: dayCalls.filter((c) => c.status === "booked").length,
    };
  });

  const hasData = calls.length > 0;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold">Weekly Recovery Funnel</h3>
          {!hasData && <p className="text-xs text-muted-foreground mt-0.5">No calls yet — data will appear after your first missed call</p>}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
            <span className="text-muted-foreground">Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Recovered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-muted-foreground">Booked</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBooked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 84%, 44%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 84%, 44%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 14%, 90%)",
                borderRadius: "12px",
                fontSize: "12px"
              }}
            />
            <Area type="monotone" dataKey="calls" stroke="hsl(217, 91%, 60%)" strokeOpacity={0.4} fill="url(#colorCalls)" strokeWidth={2} />
            <Area type="monotone" dataKey="recovered" stroke="hsl(217, 91%, 60%)" fill="url(#colorRecovered)" strokeWidth={2} />
            <Area type="monotone" dataKey="booked" stroke="hsl(168, 84%, 44%)" fill="url(#colorBooked)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}