import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, TrendingUp, Clock, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";

const valueProps = [
  {
    title: "Recovery of Lost Leads",
    icon: TrendingUp,
    problem: "Missed calls = lost customers. A business gets 50 calls/month and misses 15% = 7-8 leads gone forever.",
    solution: "CatchACaller answers those 8 calls with AI. If even 3 convert to customers at your average deal value, that's ROI in week one.",
    pitch: "Every missed call has a dollar sign attached. We make sure that dollar gets recovered.",
    metric: "Recover 30-50% of previously lost calls",
  },
  {
    title: "Instant Response = Win Rate",
    icon: Clock,
    problem: "Customer calls, waits 2 hours for callback, books with competitor. Speed kills.",
    solution: "AI responds in seconds with booking link or qualification. By the time you call back, they're already interested.",
    pitch: "First response wins. We're first.",
    metric: "Response time: 2 hours → 2 seconds",
  },
  {
    title: "Cost Per Lead Drops",
    icon: DollarSign,
    problem: "Google Ads: $15-50 per lead. Your missed calls? Free, but you're throwing them away.",
    solution: "Every missed call is a customer who already found you and wants your service. Recovering them costs nothing.",
    pitch: "Stop paying for leads. Start recovering the free ones you already have.",
    metric: "$0 additional ad spend. 30-50% more leads.",
  },
  {
    title: "Team Works Smarter",
    icon: Users,
    problem: "Sales team spends time on follow-up calls instead of closing deals.",
    solution: "AI handles qualification and follow-up. Your team only talks to hot leads ready to book.",
    pitch: "Your salespeople close more because they're not chasing cold trails.",
    metric: "Sales team time on admin: 100hrs/month → 20hrs/month",
  },
];

export default function ValuePropositions() {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <p className="text-sm text-green-900">
            💰 <strong>Pricing Context:</strong> Starter: $49/mo (basic SMS), Growth: $149/mo (team), Pro: $297/mo (advanced). ROI typically hits within first month.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {valueProps.map((prop, idx) => {
          const Icon = prop.icon;
          return (
            <Card key={idx} className="rounded-2xl flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">{prop.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div>
                  <h4 className="font-semibold text-xs text-muted-foreground mb-1">THE PROBLEM</h4>
                  <p className="text-sm">{prop.problem}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-xs text-muted-foreground mb-1">OUR SOLUTION</h4>
                  <p className="text-sm">{prop.solution}</p>
                </div>

                <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-xs text-muted-foreground mb-1">THE PITCH</h4>
                  <p className="text-sm font-medium text-foreground">{prop.pitch}</p>
                </div>

                <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
                  <h4 className="font-semibold text-xs text-muted-foreground mb-1">EXPECTED OUTCOME</h4>
                  <p className="text-sm text-accent-foreground font-medium">{prop.metric}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handleCopy(prop.pitch, `pitch-${idx}`)}
                >
                  {copied === `pitch-${idx}` ? (
                    <>
                      <Check className="w-4 h-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Pitch
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}