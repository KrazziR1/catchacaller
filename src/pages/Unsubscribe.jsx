import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Mail, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Unsubscribe() {
  const urlParams = new URLSearchParams(window.location.search);
  const [tab, setTab] = useState(urlParams.get("tab") === "sms" ? "sms" : "email");

  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const [phone, setPhone] = useState("");
  const [smsSubmitted, setSmsSubmitted] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsError, setSmsError] = useState(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    await base44.integrations.Core.SendEmail({
      to: "contact@catchacaller.com",
      subject: `Email Unsubscribe Request: ${email}`,
      body: `The following email address has requested to be unsubscribed from all CatchACaller marketing emails:\n\n${email}\n\nPlease remove this address from all marketing lists immediately.`,
    });
    setEmailSubmitted(true);
    setEmailLoading(false);
  };

  const handleSMSSubmit = async (e) => {
    e.preventDefault();
    setSmsError(null);
    if (!phone) return;

    // Normalize to E.164
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setSmsError("Please enter a valid 10-digit US phone number.");
      return;
    }
    const e164 = digits.startsWith("1") ? `+${digits}` : `+1${digits}`;

    setSmsLoading(true);
    try {
      // Record in SMSOptOut entity
      await base44.entities.SMSOptOut.create({
        phone_number: e164,
        opted_out_at: new Date().toISOString(),
        opt_out_keyword: "MANUAL_WEB_OPTOUT",
        business_phone: null,
      });

      // Mark any existing LeadConsent as invalid
      const consents = await base44.entities.LeadConsent.filter({ phone_number: e164 });
      for (const consent of consents) {
        await base44.entities.LeadConsent.update(consent.id, { is_valid: false });
      }

      // Notify admin
      await base44.integrations.Core.SendEmail({
        to: "contact@catchacaller.com",
        subject: `SMS Unsubscribe Request: ${e164}`,
        body: `The following phone number has requested to opt out of all CatchACaller SMS messages:\n\n${e164}\n\nThis has been automatically recorded in the SMSOptOut database and all consent records have been invalidated. No further SMS messages should be sent to this number.`,
      });

      setSmsSubmitted(true);
    } catch (err) {
      setSmsError("Something went wrong. Please text STOP to your CatchACaller business number directly, or email contact@catchacaller.com.");
    }
    setSmsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <a href="/" className="text-sm text-primary hover:underline mb-8 block">← Back to Home</a>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-border overflow-hidden mb-6">
          <button
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              tab === "email" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("email")}
          >
            <Mail className="w-4 h-4" /> Email Unsubscribe
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              tab === "sms" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("sms")}
          >
            <MessageSquare className="w-4 h-4" /> SMS Opt-Out
          </button>
        </div>

        {/* EMAIL TAB */}
        {tab === "email" && (
          emailSubmitted ? (
            <Card className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-xl font-bold mb-2">Unsubscribe Confirmed</h1>
              <p className="text-muted-foreground text-sm">
                <strong>{email}</strong> has been removed from all CatchACaller marketing emails. This may take up to 10 business days to take effect.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Note: You may still receive transactional emails related to your account (billing receipts, security alerts). These are required for service delivery and cannot be unsubscribed.
              </p>
            </Card>
          ) : (
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Email Unsubscribe</h1>
                  <p className="text-sm text-muted-foreground">CAN-SPAM / GDPR one-click opt-out</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email address below to unsubscribe from all CatchACaller marketing communications. Transactional emails (billing, security) are not affected.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 h-11 rounded-xl"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl h-11" disabled={emailLoading || !email}>
                  {emailLoading ? "Processing..." : "Unsubscribe Me"}
                </Button>
              </form>
            </Card>
          )
        )}

        {/* SMS TAB */}
        {tab === "sms" && (
          smsSubmitted ? (
            <Card className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-xl font-bold mb-2">SMS Opt-Out Confirmed</h1>
              <p className="text-muted-foreground text-sm">
                <strong>{phone.replace(/\D/g, "").startsWith("1") ? `+${phone.replace(/\D/g, "")}` : `+1${phone.replace(/\D/g, "")}`}</strong> has been permanently opted out of all CatchACaller SMS messages. No further messages will be sent to this number.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                You can also text <strong>STOP</strong> at any time directly to the number you received a message from.
              </p>
            </Card>
          ) : (
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">SMS Opt-Out</h1>
                  <p className="text-sm text-muted-foreground">TCPA-compliant opt-out</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Enter your phone number to permanently stop all SMS messages from CatchACaller businesses.
              </p>
              <p className="text-xs text-muted-foreground mb-6 p-3 bg-muted rounded-lg">
                💡 <strong>Fastest way:</strong> Simply reply <strong>STOP</strong> to any SMS you received and you'll be opted out immediately and automatically.
              </p>
              {smsError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-4">
                  {smsError}
                </div>
              )}
              <form onSubmit={handleSMSSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="phone">US Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setSmsError(null); }}
                    placeholder="(555) 123-4567"
                    className="mt-1.5 h-11 rounded-xl"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl h-11" disabled={smsLoading || !phone}>
                  {smsLoading ? "Processing..." : "Opt Out of SMS"}
                </Button>
              </form>
            </Card>
          )
        )}
      </div>
    </div>
  );
}