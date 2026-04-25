import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Building2, Users, DollarSign, TrendingUp, Search, Loader2, CheckCircle2, Clock, Filter } from "lucide-react";
import BusinessDetailModal from "@/components/admin/BusinessDetailModal";
import AdminKPICharts from "@/components/admin/AdminKPICharts";
import ActivityHeatmap from "@/components/admin/ActivityHeatmap";

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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

  const { data: onboardingProgress = [], isLoading: onboardingLoading } = useQuery({
    queryKey: ["admin-onboarding"],
    queryFn: () => base44.asServiceRole.entities.OnboardingProgress.list("-created_date", 500),
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
  const onboardingComplete = onboardingProgress.filter((p) => p.is_complete).length;
  const onboardingInProgress = onboardingProgress.filter((p) => !p.is_complete).length;

  const onboardingSteps = [
    "Plan Selection",
    "Business Info",
    "Phone",
    "AI Personality",
    "Booking Link",
    "Template Preview",
    "Test SMS",
    "Launch",
  ];

  // Filter businesses by search, plan, and status
  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.industry.toLowerCase().includes(searchQuery.toLowerCase());

    const sub = subscriptions.find((s) => s.user_email === b.created_by);
    const matchesPlan = filterPlan === "all" || sub?.plan_name === filterPlan;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && ["active", "trialing"].includes(sub?.status)) ||
      (filterStatus === "inactive" && !["active", "trialing"].includes(sub?.status));

    return matchesSearch && matchesPlan && matchesStatus;
  });

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

        {/* Charts & Heatmap */}
        <div className="mb-8">
          <AdminKPICharts subscriptions={subscriptions} businesses={businesses} missedCalls={missedCalls} />
        </div>

        <div className="mb-8">
          <ActivityHeatmap businesses={businesses} missedCalls={missedCalls} />
        </div>

        {/* Onboarding Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Onboarding Complete</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{onboardingComplete}</p>
              <p className="text-xs text-muted-foreground mt-1">Users finished setup</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="w-4 h-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{onboardingInProgress}</p>
              <p className="text-xs text-muted-foreground mt-1">Stuck in onboarding</p>
            </CardContent>
          </Card>
        </div>

        {/* Businesses List */}
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="space-y-4">
              <CardTitle className="text-lg">Businesses</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <Input
                    placeholder="Search by name or industry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-lg"
                  />
                </div>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-full sm:w-40 rounded-lg">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40 rounded-lg">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                      <th className="text-left py-3 px-4 font-semibold">Onboarding</th>
                      <th className="text-left py-3 px-4 font-semibold">Plan</th>
                      <th className="text-left py-3 px-4 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.map((business) => {
                      const sub = subscriptions.find((s) => s.user_email === business.created_by);
                      const subStatus = sub?.status || "inactive";
                      const progress = onboardingProgress.find((p) => p.user_email === business.created_by);

                      return (
                        <tr
                          key={business.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedBusiness(business)}
                        >
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
                            {progress ? (
                              <div className="flex items-center gap-2">
                                {progress.is_complete ? (
                                  <Badge className="bg-accent/20 text-accent text-xs">Complete</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Step {progress.current_step + 1}/8
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground" title={onboardingSteps[progress.current_step]}>
                                  {onboardingSteps[progress.current_step] || "—"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
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

        <BusinessDetailModal
          business={selectedBusiness}
          isOpen={!!selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      </div>
    </div>
  );
}