import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function LeadSourceBreakdown({ missedCalls = [] }) {
  const sourceData = [
    { name: "Google Ads", value: missedCalls.filter((c) => c.source === "google_ads").length },
    { name: "Organic", value: missedCalls.filter((c) => c.source === "organic").length },
    { name: "Referral", value: missedCalls.filter((c) => c.source === "referral").length },
    { name: "Direct", value: missedCalls.filter((c) => c.source === "direct").length },
    { name: "Unknown", value: missedCalls.filter((c) => c.source === "unknown").length },
  ].filter((d) => d.value > 0);

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (sourceData.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Lead Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No lead source data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm">Lead Sources (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {sourceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}