import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const scripts = [
  {
    industry: "HVAC",
    opening: "Hi [Name], it's [Your Name]. Quick call — I work with HVAC companies and we help recover calls that normally slip away.",
    problem: "You're out in the field. Phone rings, you're neck-deep in a job. Customer calls, gets voicemail, and 10 minutes later they're on the phone with someone else. That's revenue walking out the door.",
    solution: "What we do is answer those calls for you. AI picks up, figures out what they need, and immediately texts them your booking link. By the time you get back to civilization, they're already waiting.",
    cta: "Honestly, it's a game-changer for field companies. Want me to show you how quick this is? 10 minutes?",
  },
  {
    industry: "Plumbing",
    opening: "Hi [Name], this is [Your Name]. I wanted to talk to you because we work with plumbers and I think we can help with something specific.",
    problem: "Your phone's ringing with someone who has a busted pipe or a backed-up toilet. But you're on another job, you don't answer, and they panic. Next thing you know, they've called three other plumbers.",
    solution: "Here's what happens with us — someone calls, our AI picks up immediately, figures out if it's urgent, and texts them your availability. They feel taken care of. No panic, no competitor call.",
    cta: "The speed thing is huge for plumbing. Can I walk you through a real example? Just 10 minutes.",
  },
  {
    industry: "Roofing",
    opening: "Hey [Name], [Your Name] here. I work with roofing companies and I'm calling because I think we might have something useful for you.",
    problem: "Hail storm hits town. Your phone blows up. You're in the truck, on a roof, dealing with three jobs at once. Calls come in, you miss them. Someone down the street picks up their job instead.",
    solution: "We handle the first response. AI answers, qualifies the damage, asks if it's urgent, sends your info. They know you're legit and they're in your queue. You never miss that first impression.",
    cta: "Storm season's brutal. Let me show you how we handle it. 10 minutes on a call?",
  },
  {
    industry: "Med Spa",
    opening: "Hi [Name], it's [Your Name]. I was doing research on med spas and I think I found something that could be helpful for you.",
    problem: "Someone wants to book a procedure. It's 8pm, they're browsing online, they call you. No one picks up. Five minutes later, they're booking across town. That's a lost customer, full stop.",
    solution: "Our system texts them back in seconds with your availability and booking link. They don't feel ignored. They book with you because you responded when your competitor didn't.",
    cta: "For beauty services, speed is everything. Let me show you the difference it makes. 10 minutes?",
  },
  {
    industry: "Real Estate",
    opening: "Hi [Name], [Your Name] with [Company]. I work with real estate agents and something tells me this'll be relevant for you.",
    problem: "Prospect calls with a question about one of your listings. You're showing another property. They don't get you immediately, so they text another agent. Now you're competing instead of closing.",
    solution: "We answer right away — no voicemail. AI qualifies them, sends property info or your calendar. By the time you call back, they're impressed and ready to talk.",
    cta: "In real estate, first contact wins. Want to see how fast this works? 10 minutes?",
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