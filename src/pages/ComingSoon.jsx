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

    const res = await base44.functions.invoke("joinWaitlist", { email });

    if (res.data?.already_exists) {
      setAlreadyOnList(true);
    }
    // success or already_exists both show submitted state
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
                <p className="text-sm text-muted-foreground">We've saved your spot. Our team will personally reach out when you're ready to be onboarded.</p>
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
              Our team will personally reach out when your spot is ready.
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