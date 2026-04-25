import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, Users, Target, Zap, Download } from "lucide-react";

export default function AdvancedReporting() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: calls = [] } = useQuery({
    queryKey: ["reporting-calls"],
    queryFn: () => base44.entities.MissedCall.list("-call_time", 500),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["reporting-conversations"],
    queryFn: () => base44.entities.Conversation.list("-created_date", 500),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["reporting-bookings"],
    queryFn: () => base44.entities.CalendarBooking.list("-created_date", 500),
  });

  const { data: profile = {} } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => base44.entities.BusinessProfile.list("-created_date", 1).then(p => p[0] || {}),
  });

  // Filter by time range
  const daysAgo = parseInt(timeRange);
  const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  const filteredCalls = calls.filter(c => new Date(c.call_time) > cutoffDate);
  const filteredConversations = conversations.filter(c => new Date(c.created_date) > cutoffDate);
  const filteredBookings = bookings.filter(b => new Date(b.created_date) > cutoffDate);

  // Key metrics
  const totalCalls = filteredCalls.length;
  const engagedLeads = filteredConversations.filter(c => c.status !== "lost").length;
  const conversions = filteredBookings.length;
  const avgJobValue = profile.average_job_value || 500;
  const recoveredRevenue = conversions * avgJobValue;
  const conversionRate = totalCalls > 0 ? ((conversions / totalCalls) * 100).toFixed(1) : 0;
  const responseRate = totalCalls > 0 ? ((engagedLeads / totalCalls) * 100).toFixed(1) : 0;

  // Lead source breakdown
  const sourceData = {};
  filteredCalls.forEach(c => {
    const source = c.source || "unknown";
    sourceData[source] = (sourceData[source] || 0) + 1;
  });
  const sourceChartData = Object.entries(sourceData).map(([name, value]) => ({ name, value }));

  // Daily trend
  const dailyTrend = {};
  filteredCalls.forEach(c => {
    const date = new Date(c.call_time).toLocaleDateString();
    dailyTrend[date] = (dailyTrend[date] || 0) + 1;
  });
  const trendData = Object.entries(dailyTrend)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-14)
    .map(([date, calls]) => ({ date, calls }));

  // Conversation status breakdown
  const statusBreakdown = {};
  filteredConversations.forEach(c => {
    statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
  });
  const statusData = Object.entries(statusBreakdown).map(([status, count]) => ({ status, count }));

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Advanced Reporting</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your lead recovery performance</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-3 mb-8">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Zap className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCalls}</p>
            <p className="text-xs text-muted-foreground mt-1">Missed calls captured</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <Target className="w-4 h-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{responseRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">{engagedLeads} leads engaged</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">{conversions} bookings</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
              <Calendar className="w-4 h-4 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${avgJobValue}</p>
            <p className="text-xs text-muted-foreground mt-1">From your profile</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Revenue Recovered</CardTitle>
              <Users className="w-4 h-4 text-chart-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${recoveredRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Real bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Trend */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Call Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Lead Source Breakdown */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Lead Source Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sourceChartData} cx="50%" cy="50%" labelLine={false} label dataKey="value">
                    {sourceChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversation Status */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Conversation Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}