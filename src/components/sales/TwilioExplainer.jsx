import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";

export default function TwilioExplainer() {
  return (
    <div className="space-y-6">
      {/* What is Twilio? */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">☎️ What's Twilio Got to Do With This?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            Okay, so here's the simple version: Twilio is the phone company. Not like AT&T — they don't own cell towers. But they're the company that lets apps like ours actually answer calls and send text messages. Think of them like the middle man between your phone and software.
          </p>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3 border border-border">
            <div className="flex gap-3">
              <div className="text-primary font-bold text-lg w-8 flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Someone calls your business</h4>
                <p className="text-xs text-muted-foreground">They dial your number looking for help</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-primary font-bold text-lg w-8 flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Twilio catches it</h4>
                <p className="text-xs text-muted-foreground">Instead of going to voicemail, it routes to CatchACaller</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-primary font-bold text-lg w-8 flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Our AI picks up</h4>
                <p className="text-xs text-muted-foreground">Has a real conversation, figures out what they need</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-primary font-bold text-lg w-8 flex-shrink-0">4</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">They get texted your info</h4>
                <p className="text-xs text-muted-foreground">Booking link, your availability, whatever they need</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Without Twilio, we'd have no way to answer your phone or send texts. It's basically the plumbing that makes this whole thing work.
          </p>
        </CardContent>
      </Card>

      {/* Why Does CatchACaller Need Twilio? */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">❓ So What Does Twilio Actually Do?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">It Answers Your Calls</h4>
                <p className="text-xs text-muted-foreground mt-1">When someone dials your number and you don't pick up, Twilio makes sure it doesn't just go to voicemail — it routes to our AI instead. That's it. That's the magic.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">It Sends the Follow-Up Texts</h4>
                <p className="text-xs text-muted-foreground mt-1">After the call, Twilio's the one that actually sends the text. It's fast and reliable — happens in about 2 seconds.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">It Handles the Legal Side</h4>
                <p className="text-xs text-muted-foreground mt-1">SMS has a lot of rules (TCPA compliance, opt-outs, etc.). Twilio deals with all that so we don't accidentally break any laws sending messages.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">It Gives You the Phone Number</h4>
                <p className="text-xs text-muted-foreground mt-1">Twilio provisions your actual phone number. That's the number customers call. When they call it, the system knows to route it to us.</p>
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
          <CardTitle className="text-lg">🎤 How to Explain It (Real Conversation)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <p className="text-sm leading-relaxed">
              "So here's what happens. You get a dedicated phone number — your actual business number or a new one. When someone calls it, Twilio handles the routing. Normally, it would go to your voicemail. With us, it goes to our AI instead, who answers like a real person.
            </p>

            <p className="text-sm leading-relaxed mt-3">
              The AI talks to them, figures out what they need, and immediately texts them your booking link or next steps. Then you get the lead in a text or email. No voicemail box to check. Just qualified leads ready to go.
            </p>

            <p className="text-sm leading-relaxed mt-3">
              Think of it like hiring a smart receptionist who answers every call 24/7 and pre-qualifies people before they ever talk to you. That's the whole thing."
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">Common Questions:</h4>
            <p className="text-sm text-blue-900">
              <strong>"Is this sketchy?"</strong> → "No. Twilio powers Uber, Slack, and every major company. It's solid. And people know it's a real business number, so they trust it."
            </p>
            <p className="text-sm text-blue-900 mt-2">
              <strong>"Do I pay extra for Twilio?"</strong> → "Nope. Your monthly fee covers everything — the phone number, the AI, the texts. That's it. No surprise bills."
            </p>
            <p className="text-sm text-blue-900 mt-2">
              <strong>"Will customers know it's AI?"</strong> → "At first, maybe 10% figure it out. But honestly? Most people don't care. They got answered. They got your info. They're happy."
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