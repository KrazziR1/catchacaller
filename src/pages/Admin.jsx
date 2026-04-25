import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart3, Building2, Users, DollarSign, TrendingUp, Search, Loader2 } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      // Redirect if not admin
      if (u && u.role !== "admin") {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: () => base44.asServiceRole.entities.BusinessProfile.list("-created_date", 500),
    enabled: !!user && user.role === "admin",
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: () => base44.asServiceRole.entities.Subscription.list("-created_date", 500),
    enabled: !!user && user.role === "admin",
  });

  const { data: missedCalls = [], isLoading: callsLoading } = useQuery({
    queryKey: ["admin-missed-calls"],
    queryFn: () => base44.asServiceRole.entities.MissedCall.list("-created_date", 1000),
    enabled: !!user && user.role === "admin",
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return null;
  }

  // Calculate KPIs
  const totalBusinesses = businesses.length;
  const activeSubscriptions = subscriptions.filter(
    (s) => ["active", "trialing"].includes(s.status)
  ).length;
  const totalRevenue = subscriptions.reduce((sum, s) => {
    const planPrices = {
      Starter: 49,
      Growth: 149,
      Pro: 297,
    };
    return sum + (planPrices[s.plan_name] || 0);
  }, 0);
  const totalCalls = missedCalls.length;

  // Filter businesses by search
  const filteredBusinesses = businesses.filter((b) =>
    b.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Admin Panel</h1>
              <p className="text-muted-foreground mt-1">Site-wide analytics and business management</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                <Building2 className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalBusinesses}</p>
              <p className="text-xs text-muted-foreground mt-1">Signed up on platform</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Users className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeSubscriptions}</p>
              <p className="text-xs text-muted-foreground mt-1">Paid + trial active</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-chart-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Recurring MRR</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <TrendingUp className="w-4 h-4 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalCalls.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Missed calls captured</p>
            </CardContent>
          </Card>
        </div>

        {/* Businesses List */}
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Businesses</CardTitle>
              </div>
              <div className="flex items-center gap-2 w-full max-w-xs">
                <Search className="w-4 h-4 text-muted-foreground absolute ml-2" />
                <Input
                  placeholder="Search by name or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 rounded-lg"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {businessesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No businesses found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Business Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Industry</th>
                      <th className="text-left py-3 px-4 font-semibold">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.map((business) => {
                      const sub = subscriptions.find((s) => s.user_email === business.created_by);
                      const subStatus = sub?.status || "inactive";

                      return (
                        <tr key={business.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium">{business.business_name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="capitalize text-xs">
                              {business.industry}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-mono text-xs">{business.phone_number || "—"}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-xs text-muted-foreground">{business.created_by}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                ["active", "trialing"].includes(subStatus)
                                  ? "bg-accent/20 text-accent"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {sub?.plan_name || "—"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-xs text-muted-foreground">
                              {new Date(business.created_date).toLocaleDateString()}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}