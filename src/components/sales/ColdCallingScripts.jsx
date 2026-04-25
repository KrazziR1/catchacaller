import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const scripts = [
  {
    industry: "HVAC",
    opening: "Hi [Name], it's [Your Name]. Quick call — I work with HVAC companies and I wanted to talk about something I think you're dealing with.",
    problem: "You're out on a job. Phone rings, you see it's a customer. But you can't answer because you're elbow-deep in a service call. They get voicemail, and next thing you know they've called three other HVAC companies.",
    solution: "What we do is set it up so calls ring your phone like normal. But if you can't answer, our AI picks up instead of going to voicemail. Qualifies them in real time, sends your booking link. You get a qualified lead whether you picked up or not.",
    cta: "It's basically having a receptionist who only shows up when you're busy. Want me to show you how it works? Takes 10 minutes.",
  },
  {
    industry: "Plumbing",
    opening: "Hi [Name], this is [Your Name]. I work with plumbing companies and I have a quick question.",
    problem: "You get a call about a burst pipe. You're on another job. Can't answer right now. Customer gets voicemail. Twenty seconds later they're dialing your competitor.",
    solution: "We set it up so calls ring your phone, but if you're busy, AI takes over. Asks the right questions, sends your information. They don't feel ignored. You don't lose the job.",
    cta: "For plumbing, speed is everything. Let me show you how this looks with your business. 10 minutes?",
  },
  {
    industry: "Roofing",
    opening: "Hey [Name], [Your Name] here. I work with roofing companies and something tells me you deal with this.",
    problem: "Hail storm hits. Phones go crazy. You're swamped on site. Calls ring, you can't get to them. By the time you call back, they've already gotten three quotes from your competitors.",
    solution: "Calls still ring your phone. But if you're slammed, AI answers and qualifies. Sends your information, gets them in your pipeline. You don't miss the rush — you just don't have to answer every call in the moment.",
    cta: "During season, this is a game-changer. Want to see how it'd work for you? 10 minutes?",
  },
  {
    industry: "Med Spa",
    opening: "Hi [Name], it's [Your Name]. I work with med spas and I noticed something about how you handle calls.",
    problem: "Someone browses your website at 8pm, ready to book. Calls you. No one picks up. They're frustrated. Next thing you know, they've booked with the spa across town.",
    solution: "Calls still ring your phone. But if no one's there, AI picks up and books them in. They don't know the difference. They're in the system, ready to go.",
    cta: "For beauty, that first response is everything. Let me show you. 10 minutes?",
  },
  {
    industry: "Real Estate",
    opening: "Hi [Name], [Your Name] here. I work with real estate agents and I wanted to talk about how you handle lead calls.",
    problem: "Prospect calls about one of your listings. You're showing another property. They can't reach you. While you're calling them back, they've already texted two other agents.",
    solution: "Your phone rings like normal. But if you're showing, AI gets them on the line, answers questions, sends them property details. By the time you follow up, they're pre-qualified and ready.",
    cta: "In real estate, first touch matters. Let me show you how this changes things. 10 minutes?",
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