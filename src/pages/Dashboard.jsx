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
  const [user, setUser] = useState({ email: 'demo@catchacaller.com', role: 'admin', full_name: 'Demo Admin' });

  // Enable polling for new lead notifications
  useLeadNotifications();

  const { data: profiles = [], isLoading: profileLoading } = useQuery({
    queryKey: ["business-profile"],
    queryFn: async () => {
      try {
        const result = await Promise.race([
          base44.entities.BusinessProfile.list("-created_date", 1),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        return result;
      } catch (e) {
        console.warn('Profile fetch failed:', e.message);
        // In demo mode, return empty array to show demo dashboard
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const { data: subscriptions = [], isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await Promise.race([
          base44.entities.Subscription.filter({ user_email: user.email }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
      } catch (e) {
        console.warn('Subscription fetch failed:', e.message);
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const { data: calls = [] } = useQuery({
    queryKey: ["missed-calls"],
    queryFn: async () => {
      try {
        return await Promise.race([
          base44.entities.MissedCall.list("-call_time", 50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
      } catch (e) {
        return [];
      }
    },
    retry: 0,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      try {
        return await Promise.race([
          base44.entities.Conversation.list("-created_date", 50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
      } catch (e) {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      try {
        return await Promise.race([
          base44.entities.SMSTemplate.list("-created_date", 100),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
      } catch (e) {
        return [];
      }
    },
    retry: 0,
  });

  // Gate: redirect to onboarding if no profile set up (unless admin)
  useEffect(() => {
    if (!profileLoading && profiles.length === 0 && user?.role !== 'admin') {
      navigate("/onboarding");
    }
  }, [profileLoading, profiles, navigate, user]);

  const subscription = subscriptions[0];
  const profile = profiles[0];

  // Show dashboard immediately in demo mode; allow queries to load in background
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }



  // Admin accounts bypass subscription checks
  const isAdmin = user?.role === 'admin';
  
  if (!isAdmin) {
    // Check if trial/subscription is expired or invalid
    const trialExpired = subscription && subscription.trial_end_date && 
      new Date(subscription.trial_end_date) < new Date() &&
      subscription.status === 'trial';

    const isSubscriptionBlocked = (subscription && !["active", "trial"].includes(subscription.status)) || trialExpired;

    if (isSubscriptionBlocked) {
      return <TrialExpiredPaywall />;
    }
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

      <p className="text-sm text-muted-foreground">Demo mode - no data loaded</p>
    </div>
  );
}