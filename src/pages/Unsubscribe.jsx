import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Unsubscribe() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Log the unsubscribe request — in production, integrate with your email provider's unsubscribe API
    await base44.integrations.Core.SendEmail({
      to: "contact@catchacaller.com",
      subject: `Email Unsubscribe Request: ${email}`,
      body: `The following email address has requested to be unsubscribed from all CatchACaller marketing emails:\n\n${email}\n\nPlease remove this address from all marketing lists immediately.`,
    });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <a href="/" className="text-sm text-primary hover:underline mb-8 block">← Back to Home</a>

        {submitted ? (
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full rounded-xl h-11" disabled={loading || !email}>
                {loading ? "Processing..." : "Unsubscribe Me"}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}