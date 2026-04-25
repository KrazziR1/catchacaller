import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, TrendingUp, Clock, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";

const valueProps = [
  {
    title: "You Actually Get the Missed Calls",
    icon: TrendingUp,
    problem: "Your phone rings. You don't pick up. Now that customer is gone. A business misses just 15% of calls and that's 7-8 customers a month who bounced to a competitor.",
    solution: "We catch them. AI picks up, figures out what they need, sends them your booking link. If 3 of those convert at your average deal value, you've made your ROI in week one.",
    pitch: "Stop leaving money on the table. We answer the calls you're missing.",
    metric: "30-50% of missed calls actually recovered (real customers who called you)",
  },
  {
    title: "Speed Wins the Deal",
    icon: Clock,
    problem: "Customer needs something NOW. They call you, get voicemail, and by the time you call back 2 hours later, they've already hired someone else. Happens every day.",
    solution: "With us, they get a response in 30 seconds. Not from a robot — from an AI that actually sounds human and can answer their questions. They're impressed before you even call back.",
    pitch: "Being first matters. We get you there first.",
    metric: "Response time drops from 2 hours to 2 seconds (first contact)",
  },
  {
    title: "Cheaper Than Ads (And Way Better Quality)",
    icon: DollarSign,
    problem: "You're spending $20-50 per lead on ads. Those missed calls? They already found you. They're calling you. But you're not answering, so they go somewhere else.",
    solution: "Those are the hottest leads possible — they're actively looking and they picked YOU. Recovering them costs nothing instead of $50.",
    pitch: "Why pay $50 for a lead when you can recover the free ones that are already calling?",
    metric: "Same cost. 30-50% more actual leads that are pre-qualified",
  },
  {
    title: "Your Team Can Actually Sell",
    icon: Users,
    problem: "Your sales team spends half their day on follow-ups and qualification calls. Meanwhile, actual deals aren't closing because no one has time.",
    solution: "We handle the qualification and first follow-up. Your team only talks to people who are actually ready to move forward.",
    pitch: "Your best people get back to selling instead of making admin calls.",
    metric: "Sales team qualifies 3-5x more deals (less time on grunt work)",
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
                   <h4 className="font-semibold text-xs text-muted-foreground mb-1">SAY THIS</h4>
                   <p className="text-sm font-medium text-foreground leading-relaxed">{prop.pitch}</p>
                 </div>

                 <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                   <h4 className="font-semibold text-xs text-green-900 mb-1">WHAT HAPPENS</h4>
                   <p className="text-sm text-green-900 font-medium">{prop.metric}</p>
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