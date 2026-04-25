import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";

export default function TwilioExplainer() {
  return (
    <div className="space-y-6">
      {/* What is Twilio? */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">🔌 What is Twilio? (Simple Version)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            Twilio is a phone/SMS infrastructure company. Think of them like the "backbone" that connects phone calls and text messages to software. They don't operate phone networks — they connect apps like CatchACaller to the actual phone network.
          </p>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3 border border-border">
            <div className="flex gap-3">
              <div className="text-primary font-bold text-lg w-8 flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Business gets a missed call</h4>
                <p className="text-xs text-muted-foreground">Customer calls +1-555-HVAC-NOW</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-primary font-bold text-lg w-8 flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Twilio receives the call</h4>
                <p className="text-xs text-muted-foreground">Twilio's infrastructure answers and routes it to CatchACaller</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-primary font-bold text-lg w-8 flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">CatchACaller's AI responds</h4>
                <p className="text-xs text-muted-foreground">AI qualifies the call, asks questions, sends booking link via SMS</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-primary font-bold text-lg w-8 flex-shrink-0">4</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Business gets the lead</h4>
                <p className="text-xs text-muted-foreground">Pre-qualified, ready to convert</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Without Twilio, CatchACaller couldn't answer calls or send SMS. It's the "phone line" that makes everything possible.
          </p>
        </CardContent>
      </Card>

      {/* Why Does CatchACaller Need Twilio? */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">❓ Why Does CatchACaller Need Twilio?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">To Answer Calls</h4>
                <p className="text-xs text-muted-foreground mt-1">When a customer calls your business, Twilio's infrastructure routes that call to CatchACaller's AI. Without Twilio, we'd have no way to intercept and answer the call.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">To Send SMS Follow-Ups</h4>
                <p className="text-xs text-muted-foreground mt-1">After qualifying a lead, CatchACaller sends them an SMS with booking info. Twilio's SMS network delivers that message instantly, globally.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">To Handle TCPA Compliance</h4>
                <p className="text-xs text-muted-foreground mt-1">Twilio manages carrier relationships and compliance infrastructure so we can legally send SMS and handle opt-outs per TCPA rules.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">To Provide Phone Numbers</h4>
                <p className="text-xs text-muted-foreground mt-1">Twilio provisions dedicated phone numbers for each business. These numbers route calls to CatchACaller's platform instead of voicemail.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Context */}
      <Card className="rounded-2xl bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">💰 Twilio Cost (Simple)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm">Toll-Free Phone Number</h4>
                <p className="text-xs text-blue-800 mt-1">~$1-2/month per number</p>
              </div>
              <span className="text-xs bg-blue-100 px-2 py-1 rounded">$2/mo</span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm">Incoming Call Minutes</h4>
                <p className="text-xs text-blue-800 mt-1">For every minute CatchACaller answers a call</p>
              </div>
              <span className="text-xs bg-blue-100 px-2 py-1 rounded">~$0.01/min</span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm">Outgoing SMS</h4>
                <p className="text-xs text-blue-800 mt-1">For every SMS we send back to the lead</p>
              </div>
              <span className="text-xs bg-blue-100 px-2 py-1 rounded">~$0.01/SMS</span>
            </div>
          </div>

          <div className="bg-white/50 p-3 rounded-lg border border-blue-200 mt-4">
            <p className="text-xs text-blue-900">
              <strong>Reality:</strong> Most businesses spend $5-15/month on Twilio charges. CatchACaller's pricing covers this, so customers don't see a separate Twilio bill.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How to Explain to a Prospect */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">🎤 How to Explain to a Business Owner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <p className="text-sm leading-relaxed">
              <strong>"Here's the thing about missed calls:</strong> When someone calls your business, that call travels through phone networks. Right now, if you don't answer, it goes to voicemail. With us, we use Twilio — which is basically the infrastructure that powers most businesses' phone systems worldwide.
            </p>

            <p className="text-sm leading-relaxed mt-3">
              What we do is set you up with a dedicated Twilio phone number. When someone calls that number and you don't answer, our AI picks it up instead of a voicemail. It asks smart questions, figures out what they need, and texts them your booking link.
            </p>

            <p className="text-sm leading-relaxed mt-3">
              Think of Twilio as the 'phone line.' We're the 'secretary' that answers when you're busy."
            </p>
          </div>

          <div className="bg-accent/10 p-4 rounded-lg border border-accent/30 space-y-2">
            <h4 className="font-semibold text-sm">Key Analogy for Objections:</h4>
            <p className="text-sm">
              <strong>"Is Twilio safe?"</strong> → "Yes. Twilio powers customer support for companies like Uber, Airbnb, and Slack. They're the industry standard."
            </p>
            <p className="text-sm mt-2">
              <strong>"Is there extra cost for Twilio?"</strong> → "No. Our pricing includes everything — phone line, AI, SMS follow-up. You won't see a separate Twilio invoice."
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pro Tips */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex gap-2 items-center">
            <AlertCircle className="w-5 h-5 text-primary" />
            Pro Tips for Sales Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">✓ Don't overcomplicate it</h4>
            <p className="text-xs text-muted-foreground">Most prospects don't care HOW Twilio works. Focus on: "Your phone, answered instantly by AI. Leads follow up automatically."</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">✓ Use the secretary analogy</h4>
            <p className="text-xs text-muted-foreground">"Imagine hiring a secretary for $49/month who answers every call, qualifies leads, and texts them info. That's what this is."</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">✓ Address the "why not just use Google Voice" question</h4>
            <p className="text-xs text-muted-foreground">"Google Voice is a voicemail system. We're an AI assistant that qualifies leads in real-time. Totally different."</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">✓ Lead with the ROI</h4>
            <p className="text-xs text-muted-foreground">Don't lead with Twilio. Lead with: "You're leaving money on the table with missed calls. We recover them."</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}