import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const scripts = [
  {
    industry: "Universal Script",
    opening: "Hey [Name], my name is [Your Name] — I'm local here in [City].",
    problem: "I recently started a service that I'm offering completely free to 10 businesses for a couple of weeks. I wanted to reach out to see if you'd be interested.",
    solution: "By any chance, do you have 2 minutes to see if we'd be a good fit for [business]?",
    subtext: "We offer a service where if a lead calls your business phone number and you don't answer, we immediately send them a text from your business and answer basic questions and ultimately guide them to either book a service with you using your current booking software OR we at least start and continue the conversation to a point where you can step in and take over the conversation once you're available. I really have this built out so that businesses can customize the experience. This service is designed to convert missed calls to actual calls for service.",
    cta: "I want to be mindful of your time today, so instead of diving into all the details, I can send you a link to our website for you to check out when you're free. If you want to give us a try, text or call me and we can get you set up completely free — all I'm looking for is feedback on what we're doing great and how we can improve.",
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
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">✨ SOLUTION (Transition Question)</h3>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm leading-relaxed font-medium">{script.solution}</p>
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

            {/* Subtext */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">💡 (If They Say Yes — Explain)</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm leading-relaxed text-blue-900">{script.subtext}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-2"
                onClick={() => handleCopy(script.subtext, `subtext-${idx}`)}
              >
                {copied === `subtext-${idx}` ? (
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