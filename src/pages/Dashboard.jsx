import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PhoneMissed, MessageSquare, CalendarCheck, DollarSign } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentCallsTable from "@/components/dashboard/RecentCallsTable";
import ConversionChart from "@/components/dashboard/ConversionChart";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: profiles = [], isSuccess: profileLoaded } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => base44.entities.BusinessProfile.list("-created_date", 1),
  });

  // Gate: redirect to onboarding if no profile set up
  useEffect(() => {
    if (profileLoaded && profiles.length === 0) {
      navigate("/onboarding");
    }
  }, [profileLoaded, profiles, navigate]);

  const { data: calls = [] } = useQuery({
    queryKey: ["missed-calls"],
    queryFn: () => base44.entities.MissedCall.list("-call_time", 50),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => base44.entities.Conversation.list("-created_date", 50),
  });

  const totalCalls = calls.length;
  const repliedCalls = calls.filter(c => ["replied", "booked"].includes(c.status)).length;
  const bookedCalls = calls.filter(c => c.status === "booked").length;
  const totalRevenue = calls.reduce((sum, c) => sum + (c.estimated_value || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your call recovery performance at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Missed Calls"
          value={totalCalls}
          change="12%"
          changeType="up"
          icon={PhoneMissed}
          delay={0}
        />
        <StatCard
          title="Leads Engaged"
          value={repliedCalls}
          change="8%"
          changeType="up"
          icon={MessageSquare}
          delay={0.05}
        />
        <StatCard
          title="Bookings"
          value={bookedCalls}
          change="23%"
          changeType="up"
          icon={CalendarCheck}
          delay={0.1}
        />
        <StatCard
          title="Revenue Recovered"
          value={`$${totalRevenue.toLocaleString()}`}
          change="15%"
          changeType="up"
          icon={DollarSign}
          delay={0.15}
        />
      </div>

      <div className="grid lg:grid-cols-1 gap-6 mb-8">
        <ConversionChart />
      </div>

      <RecentCallsTable calls={calls.slice(0, 10)} />
    </div>
  );
}