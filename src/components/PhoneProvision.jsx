import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneCall, Loader2, CheckCircle2, Zap, X } from "lucide-react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function PhoneProvision({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [showPayment, setShowPayment] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [error, setError] = useState(null);
  const [cardName, setCardName] = useState("");

  const handlePaymentAndProvision = async (e) => {
    e?.preventDefault();
    
    if (!stripe || !elements) {
      setError("Payment system not ready");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      // Create payment method from card
      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
        billing_details: { name: cardName || "Phone Provision" },
      });

      if (cardError) {
        throw new Error(cardError.message);
      }

      // Send payment method to backend to charge
      const res = await base44.functions.invoke("provisionPhoneNumber", {
        paymentMethodId: paymentMethod.id,
      });

      if (res.data?.success) {
        setPhoneNumber(res.data.phone_number);
        setStatus("success");
        setShowPayment(false);
        onSuccess?.(res.data.phone_number);
      } else {
        throw new Error(res.data?.error || "Provisioning failed");
      }
    } catch (err) {
      setError(err.message || "Payment or provisioning failed");
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

  if (showPayment) {
    return (
      <div className="p-4 rounded-xl bg-white border border-border space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Secure Payment</h3>
          <button onClick={() => setShowPayment(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div>
          <label className="text-xs font-semibold text-foreground block mb-2">Cardholder Name</label>
          <Input
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="John Doe"
            className="rounded-lg h-10"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-2">Card Details</label>
          <div className="p-3 border border-input rounded-lg bg-background">
            <CardElement
              options={{
                style: {
                  base: { fontSize: "14px", color: "hsl(220, 25%, 10%)" },
                  invalid: { color: "hsl(0, 84%, 60%)" },
                },
              }}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowPayment(false);
              setError(null);
            }}
            className="flex-1 rounded-lg h-10"
            disabled={status === "loading"}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentAndProvision}
            disabled={status === "loading" || !stripe}
            className="flex-1 rounded-lg h-10"
          >
            {status === "loading" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <>Pay $2.99</>
            )}
          </Button>
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

      <Button
        onClick={() => setShowPayment(true)}
        className="w-full rounded-xl h-11"
      >
        <PhoneCall className="w-4 h-4 mr-2" /> Get My Dedicated Number — $2.99
      </Button>
    </div>
  );
}