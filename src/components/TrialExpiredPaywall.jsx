import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    priceId: "price_1TPruHFsxP0HXZ0ANSkOGCp0",
    features: ["Missed call detection", "Instant SMS auto-response", "100 SMS/month"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    priceId: "price_1TPrvMFsxP0HXZ0Apho3zV1j",
    features: ["AI conversation handling", "500 SMS/month", "Pipeline & lead scoring", "CRM integrations"],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$297",
    period: "/month",
    priceId: "price_1TPrvzFsxP0HXZ0AP2nb21Ne",
    features: ["Unlimited SMS", "Calendar booking & sync", "Multi-location", "Dedicated account manager"],
    highlighted: false,
  },
];

export default function TrialExpiredPaywall() {
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSelectPlan = async (plan) => {
    setLoadingPlan(plan.name);
    const res = await base44.functions.invoke("createCheckoutSession", { priceId: plan.priceId });
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
    setLoadingPlan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Your 7-day trial has ended</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Choose your plan to continue
          </h1>
          <p className="text-lg text-muted-foreground">
            Pick a plan that fits your business. All plans give you access to the full platform features.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-card border-2 border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                  : "bg-card border border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  Recommended
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold">{plan.name}</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={loadingPlan !== null}
                className={`w-full h-11 rounded-xl font-semibold ${
                  plan.highlighted ? "shadow-lg shadow-primary/25" : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {loadingPlan === plan.name ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue with {plan.name}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground">
          All plans include email support and access to all features. Cancel anytime, no questions asked.
        </p>
      </motion.div>
    </div>
  );
}