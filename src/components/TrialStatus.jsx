import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TrialStatus({ userEmail }) {
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscription", userEmail],
    queryFn: () => base44.entities.Subscription.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const subscription = subscriptions[0];
  if (!subscription || !subscription.trial_end_date) return null;

  const daysLeft = Math.ceil(
    (new Date(subscription.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) return null;

  return (
    <Card className={`p-4 flex items-start gap-3 ${daysLeft <= 2 ? "bg-destructive/10 border-destructive/20" : "bg-primary/10 border-primary/20"}`}>
      {daysLeft <= 2 ? (
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
      ) : (
        <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      )}
      <div>
        <p className={`text-sm font-semibold ${daysLeft <= 2 ? "text-destructive" : "text-primary"}`}>
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining in trial
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upgrade to continue using CatchACaller after your trial ends.
        </p>
      </div>
    </Card>
  );
}