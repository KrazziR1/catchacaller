import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "For solo operators getting started",
    priceId: "price_1TPruHFsxP0HXZ0ANSkOGCp0",
    features: [
      "Missed call detection",
      "Instant SMS auto-response",
      "100 SMS/month",
      "Basic templates",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    description: "For growing businesses that need AI",
    priceId: "price_1TPrvMFsxP0HXZ0Apho3zV1j",
    features: [
      "Everything in Starter",
      "AI conversation handling",
      "500 SMS/month",
      "Booking link integration",
      "Multi-step follow-ups",
      "Lead qualification",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$297",
    period: "/month",
    description: "For multi-location operations",
    priceId: "price_1TPrvzFsxP0HXZ0AP2nb21Ne",
    features: [
      "Everything in Growth",
      "Unlimited SMS",
      "Multi-location support",
      "Advanced analytics",
      "Custom AI training",
      "CRM integrations",
      "Dedicated account manager",
    ],
    cta: "Get Started",
    highlighted: false,
  },
];

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleCheckout = async (plan) => {
    setLoadingPlan(plan.name);
    const isAuthed = await base44.auth.isAuthenticated();
    if (!isAuthed) {
      base44.auth.redirectToLogin("/#pricing");
      return;
    }
    const res = await base44.functions.invoke("createCheckoutSession", { priceId: plan.priceId });
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
    setLoadingPlan(null);
    setLoadingPlan(null);
  };

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">Pricing</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Plans that pay for themselves
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One recovered job covers months of service. 7-day free trial on all plans.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-card border-2 border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                  : "bg-card border border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
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
                onClick={() => handleCheckout(plan)}
                disabled={loadingPlan !== null}
                className={`w-full h-12 rounded-xl font-semibold ${
                  plan.highlighted ? "shadow-lg shadow-primary/25" : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {loadingPlan === plan.name ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}