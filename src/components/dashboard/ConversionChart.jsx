import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const sampleData = [
  { day: "Mon", calls: 12, recovered: 7, booked: 4 },
  { day: "Tue", calls: 8, recovered: 5, booked: 3 },
  { day: "Wed", calls: 15, recovered: 10, booked: 6 },
  { day: "Thu", calls: 11, recovered: 8, booked: 5 },
  { day: "Fri", calls: 18, recovered: 13, booked: 7 },
  { day: "Sat", calls: 6, recovered: 4, booked: 2 },
  { day: "Sun", calls: 3, recovered: 2, booked: 1 },
];

export default function ConversionChart() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold">Weekly Recovery Funnel</h3>
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
          <AreaChart data={sampleData}>
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
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
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