import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneCall, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function Setup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [stage, setStage] = useState("request"); // request | sent | done | error
  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If email is in URL, auto-trigger the reset request immediately
  useEffect(() => {
    if (emailParam) {
      handleSendLink(emailParam);
    }
  }, []);

  const handleSendLink = async (emailToUse) => {
    const target = emailToUse || email;
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      await base44.auth.resetPasswordRequest(target);
      setStage("sent");
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4">
      
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <PhoneCall className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">CatchACaller</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-lg overflow-hidden">

        {/* Stage: Request / Auto-sending */}
        {stage === "request" && (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight">Set Up Your Account</h1>
              <p className="text-muted-foreground text-sm">
                We'll send a secure link to your email so you can create your password.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                className="mt-1.5 h-12 rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                autoFocus
              />
            </div>

            <Button
              className="w-full h-12 rounded-xl font-semibold"
              onClick={() => handleSendLink()}
              disabled={loading || !email}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
              ) : (
                "Send Setup Link →"
              )}
            </Button>
          </div>
        )}

        {/* Stage: Link sent */}
        {stage === "sent" && (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
              <span className="text-3xl">📬</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight">Check your inbox</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We sent a password setup link to <strong className="text-foreground">{email || emailParam}</strong>.
                Click the link in that email to create your password.
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Can't find it?</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Check your spam or junk folder</li>
                <li>Search for <strong>no-reply@catchacaller.com</strong></li>
                <li>
                  <button
                    className="text-primary underline font-medium"
                    onClick={() => handleSendLink(email || emailParam)}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Resend the link"}
                  </button>
                </li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              After setting your password you'll be taken to your dashboard automatically.
            </p>
          </div>
        )}

      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Need help?{" "}
        <a href="mailto:contact@catchacaller.com" className="text-primary underline">
          contact@catchacaller.com
        </a>
      </p>
    </div>
  );
}
