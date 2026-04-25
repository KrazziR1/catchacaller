import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, TrendingUp, Clock, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";

const valueProps = [
  {
    title: "Answer Every Call (With or Without You)",
    icon: TrendingUp,
    problem: "Your phone rings. You're busy. It goes to voicemail. That customer is gone. A business misses just 15% of calls and that's 7-8 customers a month who went somewhere else.",
    solution: "Calls ring your phone. You answer when you can. When you can't, AI does. Either way, the lead doesn't slip away. AI qualifies them, sends booking link. You get them ready to convert.",
    pitch: "Your phone actually gets answered. Every time.",
    metric: "30-50% more conversions from calls that would have gone to voicemail",
  },
  {
    title: "Human First, AI Backup",
    icon: Clock,
    problem: "Customer calls. You pick up, real conversation. Perfect. But sometimes you're busy. They get nothing. Meanwhile your competitor picks up.",
    solution: "No change to how you work. Calls ring your phone. If you're available, you take it. If not, AI takes over. Either way, the customer gets answered in seconds. No voicemail, no waiting.",
    pitch: "The best of both worlds. You when you can be there. AI when you can't.",
    metric: "100% of calls answered immediately, human or AI",
  },
  {
    title: "Free Leads (That Are Already Calling)",
    icon: DollarSign,
    problem: "You spend $20-50 per lead on ads. Meanwhile, customers are calling you directly. But you miss the call, they give up. Wasted opportunity.",
    solution: "Those callers are hot leads — they already know you exist, they're already ready. With AI backup, you don't lose them. No ad spend. Zero marginal cost per recovered lead.",
    pitch: "You're already getting the calls. We just make sure you don't lose them.",
    metric: "30-50% more revenue from leads that already found you",
  },
  {
    title: "Calls Don't Slip Through the Cracks",
    icon: Users,
    problem: "You're the owner. You can't be available 24/7. If you're with a customer and a call comes in, it goes to voicemail. That's lost business. Period.",
    solution: "Every call gets answered. You when possible. AI when not. Either way, lead goes into your pipeline, not into thin air. No more \"did I miss anyone important?\"",
    pitch: "No more wondering which calls you lost.",
    metric: "100% of calls captured and qualified automatically",
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