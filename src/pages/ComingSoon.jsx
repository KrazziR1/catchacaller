import { PhoneCall, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyOnList, setAlreadyOnList] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleWaitlist = async () => {
    if (!email || submitted || loading) return;
    setLoading(true);

    // Check for duplicate
    const existing = await base44.entities.WaitlistEntry.filter({ email }).catch(() => []);
    if (existing.length > 0) {
      setAlreadyOnList(true);
      setSubmitted(true);
      setLoading(false);
      return;
    }

    // Save to waitlist
    base44.entities.WaitlistEntry.create({ email }).catch(() => {});

    // Send confirmation email
    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        from_name: "CatchACaller",
        subject: "You're on the list — CatchACaller",
        body: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:40px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:28px;">📞</span>
              </div>
              <h1 style="color:white;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">You're on the list!</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:15px;">CatchACaller — Private Early Access</p>
            </div>
            <div style="padding:36px 32px;">
              <p style="font-size:16px;color:#1e293b;margin:0 0 16px 0;font-weight:600;">Hey there 👋</p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
                Thanks for signing up — you're now in line for early access to CatchACaller. We're onboarding businesses personally right now, so expect to hear from us soon.
              </p>
              <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #3b82f6;">
                <p style="margin:0;font-size:14px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">What CatchACaller does</p>
                <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">When you miss a call, our AI instantly texts the lead, qualifies them, and books them into your calendar — all while you're busy doing what you do best.</p>
              </div>
              <div style="display:grid;gap:12px;margin-bottom:28px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-size:18px;">⚡</span>
                  <span style="color:#334155;font-size:14px;">Responds to missed calls in under 3 seconds</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-size:18px;">📅</span>
                  <span style="color:#334155;font-size:14px;">AI qualifies leads and books appointments automatically</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-size:18px;">💰</span>
                  <span style="color:#334155;font-size:14px;">Average business recovers $2,000+ in the first month</span>
                </div>
              </div>
              <p style="color:#64748b;font-size:14px;margin:0 0 4px 0;">We'll personally reach out when your spot is ready. In the meantime, feel free to reply to this email with any questions.</p>
              <p style="color:#64748b;font-size:14px;margin:0;">— The CatchACaller Team</p>
            </div>
            <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 CatchACaller · <a href="https://catchacaller.com/privacy" style="color:#94a3b8;">Privacy</a> · <a href="https://catchacaller.com/unsubscribe" style="color:#94a3b8;">Unsubscribe</a></p>
            </div>
          </div>
        `,
      });
    } catch {
      // non-blocking
    }
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <PhoneCall className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">CatchACaller</span>
      </div>

      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-sm font-medium text-accent mx-auto">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Launching Soon
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">
          We're almost ready.
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed">
          CatchACaller is currently in private onboarding. Drop your email and we'll reach out personally when your spot is ready.
        </p>

        {submitted ? (
          <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20 space-y-1">
            {alreadyOnList ? (
              <>
                <p className="font-semibold text-accent">You're already on the list! 🎉</p>
                <p className="text-sm text-muted-foreground">We already have your email — we'll be in touch personally when your spot is ready.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-accent">You're on the list!</p>
                <p className="text-sm text-muted-foreground">Check your inbox — we just sent you a confirmation email. We'll reach out personally when your spot is ready.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWaitlist()}
                className="h-12 rounded-xl"
                disabled={loading}
              />
              <Button onClick={handleWaitlist} disabled={loading} className="h-12 px-6 rounded-xl font-semibold whitespace-nowrap">
                {loading ? "Saving..." : "Notify Me"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              You'll receive a confirmation email immediately, plus a personal follow-up from our team when your spot opens.
            </p>
          </>
        )}

        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a href="mailto:contact@catchacaller.com" className="hover:text-foreground transition-colors font-medium">
              contact@catchacaller.com
            </a>
          </div>
          <p className="text-xs text-center">Need help or have questions? Email us and we'll be in touch.</p>
        </div>

        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>
      </div>
    </div>
  );
}