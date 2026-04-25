import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Phone, Globe, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function OnboardingChecklist({ profile, subscription, user }) {
  const items = [
    {
      key: "phone",
      label: "Phone Number",
      completed: !!profile?.phone_number,
      icon: Phone,
      description: "Required for capturing missed calls",
    },
    {
      key: "booking",
      label: "Booking Link",
      completed: !!profile?.booking_url,
      icon: Globe,
      description: "Critical for closing appointments",
    },
    {
      key: "ai",
      label: "AI Personality",
      completed: !!profile?.ai_personality,
      icon: Zap,
      description: "Set your communication style",
    },
    {
      key: "team",
      label: "Team Setup",
      completed: false, // TODO: Check if team members exist
      icon: Users,
      description: "Invite team members (optional)",
    },
  ];

  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const percentage = Math.round((completed / total) * 100);

  if (percentage === 100) return null;

  return (
    <Card className="rounded-2xl border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Complete Your Setup ({completed}/{total})
            </CardTitle>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-amber-900">{percentage}% complete</p>
            <div className="w-24 h-2 bg-amber-200 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-amber-600 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-start gap-3 p-3 rounded-lg bg-white"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <Link to="/settings" className="block mt-4">
          <Button variant="outline" className="w-full rounded-lg" size="sm">
            Go to Settings
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}