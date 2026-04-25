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
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import LeadSourceBreakdown from "@/components/dashboard/LeadSourceBreakdown";
import SMSMetrics from "@/components/dashboard/SMSMetrics";
import ExportReports from "@/components/dashboard/ExportReports";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Enable polling for new lead notifications
  useLeadNotifications();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profiles = [], isSuccess: profileLoaded } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => base44.entities.BusinessProfile.list("-created_date", 1),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: calls = [] } = useQuery({
    queryKey: ["missed-calls"],
    queryFn: () => base44.entities.MissedCall.list("-call_time", 50),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => base44.entities.Conversation.list("-created_date", 50),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: () => base44.entities.SMSTemplate.list("-created_date", 100),
  });

  // Gate: redirect to onboarding if no profile set up
  useEffect(() => {
    if (profileLoaded && profiles.length === 0) {
      navigate("/onboarding");
    }
  }, [profileLoaded, profiles, navigate]);

  // Gate: if subscription record exists and is not active/trialing, block access
  // If no subscription record yet, use profile creation date as trial start (7-day grace)
  const subscription = subscriptions[0];
  const subscriptionLoaded = user && profileLoaded;
  const profile = profiles[0];

  const trialExpired = !subscription && profile &&
    (Date.now() - new Date(profile.created_date).getTime()) > 7 * 24 * 60 * 60 * 1000;

  const isSubscriptionBlocked = subscriptionLoaded && (
    (subscription && !["active", "trialing"].includes(subscription.status)) ||
    trialExpired
  );

  if (isSubscriptionBlocked) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">
            {trialExpired ? "Your Trial Has Ended" : "Subscription Required"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {trialExpired
              ? "Your 7-day free trial has expired. Subscribe to continue recovering missed calls."
              : `Your subscription is ${subscription?.status}. Please upgrade to continue.`}
          </p>
          <Button onClick={() => window.location.href = "/#pricing"} className="w-full">
            View Plans
          </Button>
        </Card>
      </div>
    );
  }

  const totalCalls = calls.length;
  const repliedCalls = calls.filter(c => ["replied", "booked"].includes(c.status)).length;
  const bookedCalls = calls.filter(c => c.status === "booked").length;
  const totalRevenue = calls.reduce((sum, c) => sum + (c.estimated_value || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {user && subscription && <TrialStatus userEmail={user.email} />}
      
      <div className="mb-8 mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your call recovery performance at a glance</p>
      </div>

      <OnboardingChecklist profile={profiles[0]} subscription={subscription} user={user} />

      <div className="flex justify-end mb-6">
        <ExportReports conversations={conversations} missedCalls={calls} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Missed Calls"
          value={totalCalls}
          icon={PhoneMissed}
          delay={0}
        />
        <StatCard
          title="Leads Engaged"
          value={repliedCalls}
          icon={MessageSquare}
          delay={0.05}
        />
        <StatCard
          title="Bookings"
          value={bookedCalls}
          icon={CalendarCheck}
          delay={0.1}
        />
        <StatCard
          title="Revenue Recovered"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          delay={0.15}
        />
      </div>

      <SMSMetrics conversations={conversations} />

      <div className="grid lg:grid-cols-2 gap-6 mb-8 mt-8">
        <ConversionChart />
        <LeadSourceBreakdown missedCalls={calls} />
      </div>

      {subscription?.plan_name && ['Growth', 'Pro'].includes(subscription.plan_name) && (
        <div className="mb-8">
          <PipelineAnalytics user={user} subscription={subscription} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <LeadPipeline user={user} subscription={subscription} />
        {subscription?.plan_name && ['Pro'].includes(subscription.plan_name) && (
          <CalendarBookingWidget user={user} subscription={subscription} />
        )}
      </div>

      <RecentCallsTable calls={calls.slice(0, 10)} />
    </div>
  );
}