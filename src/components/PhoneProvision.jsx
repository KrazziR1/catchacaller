import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { PhoneCall, Loader2, CheckCircle2, Zap } from "lucide-react";

export default function PhoneProvision({ onSuccess }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [error, setError] = useState(null);

  const provision = async () => {
    setStatus("loading");
    setError(null);
    const res = await base44.functions.invoke("provisionPhoneNumber", {});
    if (res.data?.success) {
      setPhoneNumber(res.data.phone_number);
      setStatus("success");
      onSuccess?.(res.data.phone_number);
    } else {
      setError(res.data?.error || "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-accent">Number provisioned!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your dedicated number is <span className="font-mono font-bold">{phoneNumber}</span>. Webhooks are already configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
        <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Auto-provision a dedicated number</p>
          <p className="text-xs text-muted-foreground mt-1">
            We'll instantly buy and configure a toll-free number for your account. No Twilio setup needed.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <Button
        onClick={provision}
        disabled={status === "loading"}
        className="w-full rounded-xl h-11"
      >
        {status === "loading" ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Provisioning your number...</>
        ) : (
          <><PhoneCall className="w-4 h-4 mr-2" /> Get My Dedicated Number</>
        )}
      </Button>
    </div>
  );
}