import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { PhoneCall, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubscriptionGate({ children }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Admins always get access
  if (user?.role === "admin") return children;

  const status = user?.subscription_status;
  const hasAccess = status === "active" || status === "trialing";

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">
            {status === "past_due" ? "Payment Required" : "Subscription Required"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {status === "past_due"
              ? "Your payment failed. Please update your billing details to continue."
              : status === "cancelled"
              ? "Your subscription has been cancelled. Resubscribe to regain access."
              : "Choose a plan to start recovering missed calls and converting leads."}
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/#pricing">
              <Button className="w-full h-12 rounded-xl font-semibold">
                <PhoneCall className="w-4 h-4 mr-2" />
                View Plans
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => base44.auth.logout("/")}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}