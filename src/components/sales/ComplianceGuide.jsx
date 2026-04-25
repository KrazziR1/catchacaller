import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, MapPin, Scale, Lock, DollarSign, FileText } from "lucide-react";

export default function ComplianceGuide() {
  return (
    <div className="space-y-6">
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-sm text-red-900">
            🚨 <strong>CRITICAL:</strong> SMS compliance is one of the most heavily regulated spaces in telecom. A single lawsuit from an attorney can cost $100K+. We handle all the legal complexity so our customers don't have to.
          </p>
        </CardContent>
      </Card>

      {/* The Problem */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex gap-2 items-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            The Compliance Problem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            Business owners don't think about SMS law. They just want to text back customers. But if you send <strong>one SMS to the wrong person</strong>, you could face:
          </p>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 rounded-lg bg-destructive/10">
              <DollarSign className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">$500-1,500 per violation (TCPA damages)</h4>
                <p className="text-xs text-muted-foreground mt-1">Federal law allows people to sue for unsolicited SMS. Damages are trebled in class actions.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Class action lawsuits (thousands of people)</h4>
                <p className="text-xs text-muted-foreground mt-1">Attorneys hunt for businesses violating SMS rules. One slip = lawsuit affecting 100+ customers.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Federal/State enforcement (FCC, FTC)</h4>
                <p className="text-xs text-muted-foreground mt-1">The FTC has fined companies $millions for SMS violations. State attorneys general also prosecute.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How We Handle It */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex gap-2 items-center">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            How CatchACaller Protects You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            We've built compliance into every layer of the system. Your business is protected automatically:
          </p>

          <div className="space-y-3">
            <div className="flex gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">✓ Opt-In Verification (CA/NY)</h4>
                <p className="text-xs text-muted-foreground mt-1">For California and New York, we send an automatic consent confirmation message. The lead must reply "YES" before ANY business message is sent. This creates a paper trail proving consent.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">✓ Established Business Relationship (EBR)</h4>
                <p className="text-xs text-muted-foreground mt-1">We only send SMS to numbers that have called your business. TCPA protects this "established business relationship" for 90 days. We track this automatically.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">✓ STOP/UNSUBSCRIBE Enforcement</h4>
                <p className="text-xs text-muted-foreground mt-1">When a customer texts "STOP", we immediately add them to a global opt-out list. We NEVER send them another SMS, even by accident. This is legally required and we enforce it strictly.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">✓ Do Not Call (DNC) Check</h4>
                <p className="text-xs text-muted-foreground mt-1">Before sending SMS, we check the national DNC registry. Numbers on the list are blocked automatically. Zero exceptions.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">✓ Audit Trails & Logging</h4>
                <p className="text-xs text-muted-foreground mt-1">Every SMS is logged with consent type, timestamp, delivery status, and phone number. If a lawyer comes asking questions, you have proof.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">✓ TCPA-Compliant Message Headers</h4>
                <p className="text-xs text-muted-foreground mt-1">Every SMS includes your business name and a clear opt-out instruction. This is required by law and we do it automatically.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">✓ Consent Documentation</h4>
                <p className="text-xs text-muted-foreground mt-1">When a customer calls your number, we create a consent record. When they opt in (CA/NY), we timestamp it. This is what lawyers want to see.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Laws */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex gap-2 items-center">
            <Scale className="w-5 h-5 text-primary" />
            The Laws We Comply With
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">TCPA (Telephone Consumer Protection Act)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Federal law governing SMS and calls. Key rules: (1) You can only text numbers that have called you, (2) You must honor STOP requests immediately, (3) You must include your business name and opt-out info in every message.
            </p>
            <p className="text-xs text-destructive font-medium mt-2">Damages: $500-1,500 per text (trebled in class actions)</p>
          </div>

          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-2">CCPA (California Consumer Privacy Act)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              California-specific law. For CA customers, SMS consent must be <strong>explicit</strong> — they must actively opt-in, not opt-out. We send a confirmation message. They must reply "YES". Only then do we send business messages.
            </p>
            <p className="text-xs text-destructive font-medium mt-2">Damages: Civil penalties + potential class action liability</p>
          </div>

          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-2">GDPR (EU Regulation)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If your business has any EU customers, GDPR applies. Consent must be prior and explicit. SMS data must be securely stored. We comply by only texting numbers that called you (legitimate business interest).
            </p>
            <p className="text-xs text-destructive font-medium mt-2">Penalties: Up to €20 million or 4% of annual revenue</p>
          </div>

          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-2">State Laws (NY, TX, FL, etc.)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              States have their own SMS laws. Some require additional opt-in. We track caller state and apply the strictest rules automatically. If you're sending to CA/NY, you get CA/NY protection.
            </p>
            <p className="text-xs text-destructive font-medium mt-2">Varies by state</p>
          </div>
        </CardContent>
      </Card>

      {/* State-by-State */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex gap-2 items-center">
            <MapPin className="w-5 h-5 text-primary" />
            State-Specific Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <h4 className="font-semibold text-sm text-red-900">🔴 California (CA) - Strictest</h4>
              <p className="text-xs text-red-800 mt-1">Explicit opt-in required. Lead must reply YES. We handle this with an automatic opt-in message.</p>
            </div>

            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <h4 className="font-semibold text-sm text-red-900">🔴 New York (NY) - Strict</h4>
              <p className="text-xs text-red-800 mt-1">Similar to CA. Explicit consent required. We treat NY same as CA for maximum protection.</p>
            </div>

            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <h4 className="font-semibold text-sm text-orange-900">🟠 Texas (TX) - Moderate</h4>
              <p className="text-xs text-orange-800 mt-1">Requires prior express written consent. EBR (calling your business) counts. Standard TCPA rules apply.</p>
            </div>

            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <h4 className="font-semibold text-sm text-orange-900">🟠 Florida (FL) - Moderate</h4>
              <p className="text-xs text-orange-800 mt-1">Prohibited calling sellers of insurance. Otherwise standard TCPA. We block insurance sellers automatically.</p>
            </div>

            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <h4 className="font-semibold text-sm text-yellow-900">🟡 Other States - Standard TCPA</h4>
              <p className="text-xs text-yellow-800 mt-1">Rest of US follows standard TCPA: Text only to numbers that called you. Honor STOP requests. Include opt-out.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Triggers Lawsuits */}
      <Card className="rounded-2xl bg-destructive/5 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-lg flex gap-2 items-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            What Actually Triggers Lawsuits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex gap-2">
              <span className="font-bold text-destructive">❌</span>
              <span><strong>Texting numbers that never called you</strong> — This is the #1 lawsuit trigger. We prevent this by only texting callers.</span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold text-destructive">❌</span>
              <span><strong>Not honoring STOP requests</strong> — If someone texts STOP and you keep texting them, attorneys will call. We block opt-outs permanently.</span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold text-destructive">❌</span>
              <span><strong>Missing CA/NY opt-in</strong> — California and NY laws are strict. Sending without explicit YES = lawsuit. We enforce this automatically.</span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold text-destructive">❌</span>
              <span><strong>No opt-out language in SMS</strong> — TCPA requires you to tell people how to opt out. We include it in every message.</span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold text-destructive">❌</span>
              <span><strong>Texting numbers on DNC list</strong> — Checking the Do Not Call registry is required. We check automatically.</span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold text-destructive">❌</span>
              <span><strong>No paper trail of consent</strong> — If you're sued and can't prove consent, you lose. We create full audit logs.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Sell This */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex gap-2 items-center">
            <FileText className="w-5 h-5 text-primary" />
            How to Explain Compliance to a Prospect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-lg space-y-3 border border-primary/20">
            <p className="text-sm leading-relaxed">
              <strong>"Look, SMS compliance is complicated. But I'm going to keep it simple:</strong>
            </p>

            <p className="text-sm leading-relaxed">
              We only text people who called you. That's protected under federal law. The moment they text STOP, we never bother them again — no exceptions. If you're in California or New York, we send a confirmation message first so there's zero doubt about consent. And we track everything — every text, every opt-out, every timestamp.
            </p>

            <p className="text-sm leading-relaxed">
              Why does this matter? Because if a lawyer ever comes asking questions, you'll have bulletproof documentation that you did everything right. That's what separates the businesses that get sued from the ones that don't.
            </p>

            <p className="text-sm leading-relaxed font-semibold">
              Our job is to make sure compliance is automatic. Your job is to grow your business."
            </p>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Most business owners have no idea SMS has regulations. The ones who understand are scared. Positioning yourself as "the compliant option" is huge competitive advantage.
          </p>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">📚 Compliance Resources for Prospects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-semibold mb-3">Send these links to prospects who want to learn more:</p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>TCPA Overview:</strong>{" "}
              <a href="https://www.ftc.gov/news-events/topics/telemarketing" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                FTC Telemarketing Rules
              </a>{" "}
              (official government source)
            </p>

            <p>
              <strong>CCPA (California):</strong>{" "}
              <a href="https://www.oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                California Attorney General CCPA
              </a>
            </p>

            <p>
              <strong>SMS Best Practices:</strong>{" "}
              <a href="https://www.twilio.com/en-us/use-cases/sms-compliance" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Twilio SMS Compliance Guide
              </a>{" "}
              (from our SMS provider)
            </p>

            <p>
              <strong>Our Compliance:</strong> Link prospects to your{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Privacy Policy
              </a>
              ,{" "}
              <a href="/sms-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                SMS Policy
              </a>
              , and{" "}
              <a href="/dpa" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Data Protection Agreement (DPA)
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* The Pitch */}
      <Card className="rounded-2xl bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="text-lg">✨ The Closing Pitch</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            <strong>"Most businesses don't think about SMS compliance until they get a lawyer's letter. By then it's too late. We handle all of this automatically — opt-ins, opt-outs, DNC checks, state-specific rules, audit logs. So you can focus on running your business instead of worrying about getting sued."</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}