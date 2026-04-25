import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const templates = [
  {
    name: "Day 1 Follow-Up (If No Interest)",
    timing: "24 hours after initial call",
    template: `Hi [Name],

Wanted to circle back on our conversation yesterday about CatchACaller. I realized I should've mentioned this — we just worked with [Similar Company in Their Industry] and recovered $3,400 in lost leads in their first month.

No pressure, but if you're curious how we'd do the same for you, let me know.

Talk soon,
[Your Name]`,
  },
  {
    name: "Value-Add Follow-Up",
    timing: "3 days after call",
    template: `Hey [Name],

I put together a quick breakdown of what we'd do for your business based on our conversation. I don't think you're gonna find this anywhere else, so I wanted to send it your way.

[ATTACH: 1-page PDF with their industry's recovery stats]

If this resonates, I'd love 15 minutes to walk through it.

Cheers,
[Your Name]`,
  },
  {
    name: "Social Proof Follow-Up",
    timing: "1 week after call",
    template: `[Name],

I know I've reached out a couple times — don't want to be annoying, but I keep thinking about our conversation.

We just got [Competitor/Similar Company] live, and they're already seeing 40+ recovered leads per month at [Industry] pricing. Figured you'd want to know what's actually possible.

Open to a quick chat? No strings.

[Your Name]`,
  },
  {
    name: "Demo Offer",
    timing: "10 days after call (last push)",
    template: `[Name],

Alright, last one from me. 😊

I'd like to show you a demo of CatchACaller running on a [Their Industry]-specific scenario. Takes 10 minutes, no sales pitch — just show and tell.

If you hate it, you never hear from me again. Fair?

[Calendar Link]

[Your Name]`,
  },
  {
    name: "Breakup Email (After No Response)",
    timing: "3+ weeks of no response",
    template: `[Name],

I think the timing just isn't right. No worries at all.

But if you ever find yourself frustrated by missed calls, you know where to find me. We'll be here.

All the best,
[Your Name]`,
  },
  {
    name: "Win-Back Email (After 30 Days)",
    timing: "30+ days, reaching back out",
    template: `[Name],

It's been a while. I wanted to reach out because we've made some updates to CatchACaller that specifically address [Industry]-specific pain point you mentioned.

We now [New Feature]. Thought it might be relevant.

Worth a quick conversation?

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
            📧 <strong>The Follow-Up Sequence:</strong> Most deals close on the 3rd-5th touch point. Don't give up after one call! Personalize each with specific details about their business.
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
          <CardTitle className="text-lg">🎯 Follow-Up Strategy Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Day 1: Initial Call</h4>
              <p className="text-xs text-muted-foreground">Make the pitch. Listen more than you talk. Ask if they're interested.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 1-2: If "Maybe" or "Not Now"</h4>
              <p className="text-xs text-muted-foreground">Send short follow-up. Remind them of the pain point you discussed.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 3-4: Provide Value</h4>
              <p className="text-xs text-muted-foreground">Send something useful — case study, demo link, stat relevant to their industry.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 7: Social Proof</h4>
              <p className="text-xs text-muted-foreground">Show a win from their industry. Show it works, not why it works.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 10: Last Ask</h4>
              <p className="text-xs text-muted-foreground">Offer a demo or call. Make it low-friction. "10 minutes, no pitch."</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Day 21+: Respectful Breakup</h4>
              <p className="text-xs text-muted-foreground">Stop pushing. Send a "no hard feelings" email. Leave the door open.</p>
            </div>
          </div>

          <div className="bg-accent/10 p-4 rounded-lg border border-accent/30 mt-4">
            <h4 className="font-semibold text-sm mb-2">💡 Pro Rules</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• <strong>Personalize everything.</strong> Use their name, their business type, recent local events.</li>
              <li>• <strong>Don't be pushy.</strong> Give them an out. "If now's not the time, I totally get it."</li>
              <li>• <strong>Lead with value, not features.</strong> They don't care about tech. They care about missed revenue.</li>
              <li>• <strong>Volume matters.</strong> Don't spend 2 weeks on one prospect. Make 10 calls, follow up with 8.</li>
              <li>• <strong>Track responses.</strong> Note who said "maybe" vs "not interested" — they're different follow-ups.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}