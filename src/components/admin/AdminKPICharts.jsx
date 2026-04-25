import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingDown } from "lucide-react";

export default function AdminKPICharts({ subscriptions, businesses, missedCalls }) {
  // Monthly Revenue Trending (simulated last 6 months)
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const count = subscriptions.filter((s) => {
      const created = new Date(s.created_date);
      return (
        created.getMonth() === month.getMonth() &&
        created.getFullYear() === month.getFullYear()
      );
    }).length;
    const revenue = count * 100; // rough estimate
    return {
      month: month.toLocaleDateString("en-US", { month: "short" }),
      revenue,
    };
  });

  // Plan Distribution
  const planDistribution = [
    { name: "Starter", value: subscriptions.filter((s) => s.plan_name === "Starter").length },
    { name: "Growth", value: subscriptions.filter((s) => s.plan_name === "Growth").length },
    { name: "Pro", value: subscriptions.filter((s) => s.plan_name === "Pro").length },
  ];

  // Business Health Alerts
  const healthIssues = businesses
    .filter((b) => {
      const daysSinceCreated = (Date.now() - new Date(b.created_date).getTime()) / (1000 * 60 * 60 * 24);
      return (
        !b.phone_number ||
        !b.booking_url ||
        (daysSinceCreated > 7 && !missedCalls.find((c) => c.created_by === b.created_by))
      );
    })
    .map((b) => {
      const issues = [];
      if (!b.phone_number) issues.push("No phone");
      if (!b.booking_url) issues.push("No booking URL");
      const daysSinceCreated = (Date.now() - new Date(b.created_date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated > 7 && !missedCalls.find((c) => c.created_by === b.created_by))
        issues.push("No activity");
      return { business: b.business_name, issues };
    });

  const colors = ["#3b82f6", "#10b981", "#f59e0b"];

  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Health Alerts */}
      {healthIssues.length > 0 && (
        <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Business Health Issues ({healthIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthIssues.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <p className="font-medium">{item.business}</p>
                <div className="flex gap-1">
                  {item.issues.map((issue, i) => (
                    <Badge key={i} variant="outline" className="bg-destructive/10 text-destructive text-xs">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}