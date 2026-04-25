import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, TrendingUp, Clock, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";

const valueProps = [
  {
    title: "Missed Calls Are Lost Customers",
    summary: "Every missed call is money walking away to your competitor.",
    benefit: "You answer when you can. AI answers when you can't. Either way, the customer gets through.",
  },
  {
    title: "No Change to How You Work",
    summary: "This isn't another app to check. It's transparent.",
    benefit: "Calls ring your phone like always. You pick up if you're free. AI steps in if you're busy. That's it.",
  },
  {
    title: "Qualified Leads, Not Just Contacts",
    summary: "It's not just about answering. It's about answering right.",
    benefit: "AI qualifies them, asks the right questions, and sends your booking link when they're ready. You get pre-screened leads.",
  },
  {
    title: "Costs Less Than Missing One Job",
    summary: "One missed $500 job pays for a year of service.",
    benefit: "At $49-297/month, you break even on a single recovered call. Everything else is pure profit.",
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
      <Card className="bg-accent/10 border-accent/30">
        <CardContent className="pt-6">
          <p className="text-sm font-medium">
            💬 <strong>Use this section in your follow-up call:</strong> When they say "tell me more," walk through these points. Each one answers a different concern.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {valueProps.map((prop, idx) => (
          <Card key={idx} className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg mb-1">{prop.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{prop.summary}</p>
            </CardHeader>
            <CardContent>
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="text-base font-medium text-foreground leading-relaxed">{prop.benefit}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}