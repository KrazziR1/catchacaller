import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const templates = [
  {
    name: "Day 1 Follow-Up (If They Seemed Interested)",
    timing: "24 hours after call",
    template: `Hi [Name],

Quick thought after our call yesterday — I was on the phone with a [similar business type] this morning and they just turned their first recovered lead into a $2,400 job. 

Anyway, figured you'd want to know it actually works. Happy to show you how it'd look for your business if you want.

[Your Name]`,
  },
  {
    name: "Send Something Useful",
    timing: "3 days after call",
    template: `Hey [Name],

I looked up a few stats on what other [industry] companies in your area are doing with missed calls — turns out you're leaving about [X]% on the table. Grabbed a quick breakdown and sent it over.

Not trying to sell you, just thought you'd want to see the actual numbers for your area.

Let me know if any of it resonates.

[Your Name]`,
  },
  {
    name: "Proof Point (Less Salesy)",
    timing: "1 week after call",
    template: `[Name],

I know you might not be ready yet, and that's totally cool. But I helped a [competitor name] get this live last month and they've pulled in about 40+ solid leads they were losing before.

Figured I'd share that in case you ever want to revisit it.

[Your Name]`,
  },
  {
    name: "Light Demo Offer",
    timing: "10 days after call",
    template: `[Name],

Hey — I know you're busy. But I set up a 10-minute demo specific to [their industry] so you can actually see how it works, zero pressure.

If it's not for you, we're good. No hard feelings.

[Calendar Link]

[Your Name]`,
  },
  {
    name: "Respectful Exit",
    timing: "3+ weeks of no response",
    template: `[Name],

I'm going to stop reaching out because I know you're busy.

But seriously — if you ever get frustrated with missed calls costing you money, you know where to find me. We're always here if the timing gets better.

Good luck with everything.

[Your Name]`,
  },
  {
    name: "Soft Win-Back (Way Later)",
    timing: "30+ days of silence",
    template: `[Name],

Random reach out — we added something that I think you specifically mentioned was a problem when we talked back in [month].

Probably not relevant anymore, but thought I'd mention it just in case.

Worth a 5-minute conversation?

[Your Name]`,
  },
];

export default function FollowUpTemplates() {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-purple-50 border-purple-200">
         <CardContent className="pt-6">
           <p className="text-sm text-purple-900">
             📧 <strong>Real Talk:</strong> Most people say "no" on the first call. But if you send one smart follow-up showing you actually care (not a generic pitch), deals happen. The key: don't be pushy. Show value, then back off.
           </p>
         </CardContent>
       </Card>

      <div className="space-y-4">
        {templates.map((template, idx) => (
          <Card key={idx} className="rounded-2xl">
            <CardHeader>
              <div>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">⏱️ {template.timing}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg border border-border font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {template.template}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleCopy(template.template, `template-${idx}`)}
                >
                  {copied === `template-${idx}` ? (
                    <>
                      <Check className="w-4 h-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Template
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Follow-Up Strategy Card */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">🎯 When to Follow Up (And How Not to Annoy People)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Day 1: The Call</h4>
              <p className="text-xs text-muted-foreground">Have a real conversation. Ask questions. Don't just pitch. See if they're actually interested or just being polite.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 1-2: If They Said "Maybe"</h4>
              <p className="text-xs text-muted-foreground">Send one short email showing you listened. Reference something specific they said. No pitch, just "I think this matters to you."</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 3-4: Send Something Real</h4>
              <p className="text-xs text-muted-foreground">A stat about their industry. A case study from a competitor. Proof that this actually works. Make them think, not sell them.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 7: Another Proof Point</h4>
              <p className="text-xs text-muted-foreground">Share a win. "We just helped [business] close 40 leads they were missing." Keep it short. No ask.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 10: One Demo Offer</h4>
              <p className="text-xs text-muted-foreground">Not pushy. "Here's a 10-minute demo if you want to see it. No pressure." Then actually mean it.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 21+: Back Off</h4>
              <p className="text-xs text-muted-foreground">One final "no hard feelings" email and stop. You did your job. Move on to the next prospect.</p>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4">
            <h4 className="font-semibold text-sm text-orange-900 mb-2">⚡ The Real Secret</h4>
            <ul className="text-xs space-y-1 text-orange-900">
              <li>• <strong>Personalize it.</strong> Say their name. Know their business. Reference something they said.</li>
              <li>• <strong>Assume they're busy.</strong> Make every email 30 seconds to read. Respect their time.</li>
              <li>• <strong>No fake urgency.</strong> "Limited time offer" is annoying. Real value speaks for itself.</li>
              <li>• <strong>You're not the only one calling.</strong> Make 10 calls, follow up with 8, close 2-3. Volume wins.</li>
              <li>• <strong>Actually listen on the call.</strong> They'll tell you if they're interested. Stop talking so much.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}