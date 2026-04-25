import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const scripts = [
  {
    industry: "HVAC",
    opening: "Hi [Name], this is [Your Name] from CatchACaller. We work with HVAC companies to make sure they never miss another customer call — especially the ones that come in after hours.",
    problem: "I know you probably get a ton of calls — some during business hours, some not. And when you're busy in the field, those missed calls just... disappear. No follow-up, no lead.",
    solution: "We've built AI that instantly texts back anyone who calls and misses you. It qualifies them, answers their questions, and sends them your booking link. All automatically. You're never out of reach again.",
    cta: "Would it make sense to jump on a 15-minute call this week so I can show you exactly how it works?",
  },
  {
    industry: "Plumbing",
    opening: "Hi [Name], this is [Your Name] with CatchACaller. I'm reaching out because we specialize in helping plumbers recover missed calls — you know, the ones that go to voicemail at 2pm on a Tuesday.",
    problem: "A missed call to a plumber is usually a customer with an emergency. They're stressed, they need help NOW, and if you don't respond fast, they call your competitor.",
    solution: "Our system answers instantly with AI that understands the urgency. It gets details, confirms the problem, and sends your booking link. By the time you see the lead, they're already pre-qualified.",
    cta: "I'd love to show you how this works with your phones. Could we grab 15 minutes?",
  },
  {
    industry: "Roofing",
    opening: "Hi [Name], it's [Your Name] from CatchACaller. We help roofing companies turn missed calls into booked jobs — even when you're up on a roof without your phone.",
    problem: "Storm season = phone ringing constantly. But you're in the field, your team's busy, and calls get dropped. That's lost revenue right there.",
    solution: "We've set up roofing companies with an AI phone assistant that handles initial calls. It texts back, asks the right questions, and queues qualified leads for you. It's like having a secretary who never sleeps.",
    cta: "I think we could fill your pipeline pretty quickly. Can we chat for 15 minutes this week?",
  },
  {
    industry: "Med Spa",
    opening: "Hi [Name], this is [Your Name] from CatchACaller. We work with med spas to make sure appointment requests never fall through the cracks — especially the late-night ones.",
    problem: "Booking is everything for you. But people call at 8pm, 9pm, and if no one answers, they book with your competitor. Even if you follow up the next day, it's too late.",
    solution: "Our AI answers your calls 24/7 and instantly texts them back with your booking link. No appointment request gets lost. People get texted in seconds with your availability.",
    cta: "I'd like to show you how we can reduce your booking friction. Does 15 minutes work this week?",
  },
  {
    industry: "Real Estate",
    opening: "Hi [Name], this is [Your Name] from CatchACaller. We help real estate agents make sure every lead inquiry gets instant follow-up — even if they're showing a property.",
    problem: "Real estate is competitive. A buyer calls with a question about a listing, and if they don't get an instant response, they're already talking to another agent.",
    solution: "We've built an AI assistant that answers calls, qualifies leads, and texts them property details or booking links. Your leads are engaged the second they call.",
    cta: "I think this could be a game-changer for your lead flow. Could we spend 15 minutes together?",
  },
];

export default function ColdCallingScripts() {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            💡 <strong>Pro Tip:</strong> Personalize these with the prospect's name, their specific business, and recent local news (new construction, recent storms, etc.). The more specific, the better the response rate.
          </p>
        </CardContent>
      </Card>

      {scripts.map((script, idx) => (
        <Card key={idx} className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">{script.industry}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Opening */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">📞 OPENING</h3>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm leading-relaxed">{script.opening}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-2"
                onClick={() => handleCopy(script.opening, `opening-${idx}`)}
              >
                {copied === `opening-${idx}` ? (
                  <>
                    <Check className="w-4 h-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </Button>
            </div>

            {/* Problem */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">⚠️ PROBLEM (Identify Pain)</h3>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm leading-relaxed">{script.problem}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-2"
                onClick={() => handleCopy(script.problem, `problem-${idx}`)}
              >
                {copied === `problem-${idx}` ? (
                  <>
                    <Check className="w-4 h-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </Button>
            </div>

            {/* Solution */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">✨ SOLUTION (Show Value)</h3>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm leading-relaxed">{script.solution}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-2"
                onClick={() => handleCopy(script.solution, `solution-${idx}`)}
              >
                {copied === `solution-${idx}` ? (
                  <>
                    <Check className="w-4 h-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </Button>
            </div>

            {/* CTA */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">🎯 CALL-TO-ACTION (Close)</h3>
              <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
                <p className="text-sm leading-relaxed font-medium">{script.cta}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-2"
                onClick={() => handleCopy(script.cta, `cta-${idx}`)}
              >
                {copied === `cta-${idx}` ? (
                  <>
                    <Check className="w-4 h-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}