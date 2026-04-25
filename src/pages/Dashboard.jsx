import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import useLeadNotifications from "@/hooks/useLeadNotifications";
import { PhoneMissed, MessageSquare, CalendarCheck, DollarSign, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/dashboard/StatCard";
import RecentCallsTable from "@/components/dashboard/RecentCallsTable";
import ConversionChart from "@/components/dashboard/ConversionChart";
import LeadPipeline from "@/components/dashboard/LeadPipeline";
import CalendarBookingWidget from "@/components/dashboard/CalendarBookingWidget";
import PipelineAnalytics from "@/components/dashboard/PipelineAnalytics";
import TrialStatus from "@/components/TrialStatus";
import TrialExpiredPaywall from "@/components/TrialExpiredPaywall";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import LeadSourceBreakdown from "@/components/dashboard/LeadSourceBreakdown";
import SMSMetrics from "@/components/dashboard/SMSMetrics";
import ExportReports from "@/components/dashboard/ExportReports";
import LeadScoringDistribution from "@/components/dashboard/LeadScoringDistribution";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Fetch real user on mount and handle redirects
  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u?.role === 'admin') {
        navigate("/admin", { replace: true });
        return;
      }
      setUser(u);
    }).catch(() => {
      setUser(null);
      navigate("/", { replace: true });
    });
  }, [navigate]);

  // Enable polling for new lead notifications
  useLeadNotifications();

  // Redirect to onboarding if no profile exists after loading
  useEffect(() => {
    if (user && !profileLoading && profiles.length === 0) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, profileLoading, profiles.length, navigate]);

  const { data: profiles = [], isLoading: profileLoading } = useQuery({
    queryKey: ["business-profile", user?.email],
    queryFn: () => base44.entities.BusinessProfile.list("-created_date", 1),
    enabled: !!user?.email && user?.role !== 'admin',
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ user_email: user.email }),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: calls = [] } = useQuery({
    queryKey: ["missed-calls"],
    queryFn: () => base44.entities.MissedCall.list("-call_time", 50),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => base44.entities.Conversation.list("-created_date", 50),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: () => base44.entities.SMSTemplate.list("-created_date", 100),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const subscription = subscriptions[0];
  const profile = profiles[0];

  // Block rendering while loading user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If admin or no profile, don't render (useEffect will redirect)
  if (user.role === 'admin' || profiles.length === 0) {
    return null;
  }

  // Check subscription status for regular users
  const trialExpired = subscription && subscription.trial_end_date && 
    new Date(subscription.trial_end_date) < new Date() &&
    ['trial', 'incomplete'].includes(subscription.status);

  const isSubscriptionBlocked = (subscription && !["active", "trial"].includes(subscription.status)) || trialExpired;

  if (isSubscriptionBlocked) {
    return <TrialExpiredPaywall />;
  }

  const totalCalls = calls.length;
  const repliedCalls = calls.filter(c => ["replied", "booked"].includes(c.status)).length;
  const bookedCalls = calls.filter(c => c.status === "booked").length;
  const totalRevenue = calls.reduce((sum, c) => sum + (c.estimated_value || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8 mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your call recovery performance at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Missed Calls" value={totalCalls} icon={PhoneMissed} delay={0} />
        <StatCard title="Leads Engaged" value={repliedCalls} icon={MessageSquare} delay={0.05} />
        <StatCard title="Bookings" value={bookedCalls} icon={CalendarCheck} delay={0.1} />
        <StatCard title="Revenue Recovered" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} delay={0.15} />
      </div>

      {/* Check if onboarding incomplete - prompt to start */}
      {!profile?.phone_number && (
        <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-4 mb-8">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Complete Your Setup</h3>
            <p className="text-sm text-blue-800 mb-3">You haven't added a phone number yet. Let's finish setup so you can start capturing missed calls.</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/onboarding")} className="bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                Resume Onboarding
              </Button>
              <Button variant="outline" onClick={() => navigate("/settings")} className="rounded-lg text-sm">
                Go to Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <RecentCallsTable calls={calls} />
        <ConversionChart conversations={conversations} calls={calls} />
        <LeadSourceBreakdown missedCalls={calls} />
        <SMSMetrics />
        <LeadScoringDistribution conversations={conversations} />
        <LeadPipeline conversations={conversations} subscription={subscription} profile={profile} user={user} />
        {subscription?.plan_name && ['Growth', 'Pro'].includes(subscription.plan_name) && (
          <>
            <PipelineAnalytics conversations={conversations} subscription={subscription} />
            {subscription.plan_name === 'Pro' && <CalendarBookingWidget profile={profile} />}
          </>
        )}
        <ExportReports conversations={conversations} missedCalls={calls} />
      </div>
    </div>
  );
}