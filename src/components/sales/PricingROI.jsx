import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, DollarSign, Target } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for solopreneurs and small teams",
    features: [
      "Toll-free phone number",
      "AI call answering",
      "Auto-SMS follow-ups",
      "Basic conversations dashboard",
      "Email notifications",
    ],
  },
  {
    name: "Growth",
    price: 149,
    description: "For growing teams managing more leads",
    features: [
      "Everything in Starter +",
      "Team member access",
      "SMS templates",
      "Advanced analytics",
      "Conversation assignment",
      "CRM sync (Zapier)",
    ],
  },
  {
    name: "Pro",
    price: 297,
    description: "For multi-team operations",
    features: [
      "Everything in Growth +",
      "Calendar booking integration",
      "Advanced reporting & exports",
      "Custom AI personality",
      "Priority support",
      "HubSpot/Salesforce sync",
    ],
  },
];

export default function PricingROI() {
  const [selectedPlan, setSelectedPlan] = useState("Starter");
  const [jobValue, setJobValue] = useState("500");
  const [conversionRate, setConversionRate] = useState("10");

  // Find selected plan
  const plan = plans.find((p) => p.name === selectedPlan);
  const monthlyPrice = plan.price;
  const avgJobValue = parseFloat(jobValue) || 0;
  const conversionPercent = parseFloat(conversionRate) || 0;

  // Calculate breakeven
  // Assumption: On average, a business recovers 5-15 missed calls per month
  // Out of recovered leads, typical conversion rate is 10-20%
  const missedCallsPerMonth = 10;
  const leadsRecovered = missedCallsPerMonth;
  const leadsConverted = (leadsRecovered * conversionPercent) / 100;
  const revenueGenerated = leadsConverted * avgJobValue;
  const breakeven = leadsRecovered / conversionPercent * 100;
  const profitMargin = revenueGenerated - monthlyPrice;

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            💰 <strong>Real Math:</strong> Most businesses need to recover just 1-3 qualified leads per month to hit ROI. This plan pays for itself in week one for most industries.
          </p>
        </CardContent>
      </Card>

      {/* Interactive ROI Calculator */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">🧮 ROI Calculator</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">See how many recovered leads it takes to break even</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-semibold mb-3">Select Plan</label>
            <div className="grid grid-cols-3 gap-3">
              {plans.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedPlan(p.name)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPlan === p.name
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">${p.price}/mo</div>
                </button>
              ))}
            </div>
          </div>

          {/* Job Value Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">Average Job/Service Value ($)</label>
            <Input
              type="number"
              value={jobValue}
              onChange={(e) => setJobValue(e.target.value)}
              placeholder="500"
              className="rounded-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Typical: HVAC $1,500 | Plumbing $800 | Roofing $5,000 | Med Spa $200 | Lawn Care $40
            </p>
          </div>

          {/* Conversion Rate Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">Expected Conversion Rate (%)</label>
            <Input
              type="number"
              value={conversionRate}
              onChange={(e) => setConversionRate(e.target.value)}
              placeholder="10"
              className="rounded-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Typical: 10-20% (AI-qualified leads convert higher than cold calls)
            </p>
          </div>

          {/* Results */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Breakeven Leads</p>
              <p className="text-2xl font-bold text-primary">
                {Math.ceil(breakeven)}
              </p>
              <p className="text-xs text-muted-foreground">
                At {conversionPercent}% conversion
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Revenue (10 calls/mo)</p>
              <p className="text-2xl font-bold text-accent">
                ${revenueGenerated.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                From recovered calls
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Monthly Profit</p>
              <p className={`text-2xl font-bold ${profitMargin > 0 ? "text-green-600" : "text-red-600"}`}>
                ${profitMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                After plan cost
              </p>
            </div>
          </div>

          {/* Key Insight */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-sm text-green-900 mb-2">✓ The Insight</h4>
            <p className="text-sm text-green-900 leading-relaxed">
              Most businesses get <strong>10-15 missed calls per month</strong>. If just{" "}
              <strong>{Math.ceil(breakeven)} of those</strong> convert to a {avgJobValue ? `$${avgJobValue}` : "typical"} job, you've
              covered your entire monthly plan cost. Everything after that is profit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Details */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Plans Explained</h3>

        {plans.map((p) => (
          <Card key={p.name} className={`rounded-2xl ${selectedPlan === p.name ? "border-primary border-2" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{p.name} — ${p.price}/month</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Breakeven at</p>
                  <p className="text-2xl font-bold text-primary">
                    {Math.max(1, Math.ceil((p.price / (avgJobValue * (conversionPercent / 100))) || 3))} leads
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {p.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Industry Examples */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex gap-2 items-center">
            <Target className="w-5 h-5" />
            Industry Breakeven Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                industry: "Lawn Care",
                avgPrice: 40,
                missedCalls: 20,
                conversionRate: 15,
              },
              {
                industry: "Plumbing",
                avgPrice: 800,
                missedCalls: 8,
                conversionRate: 18,
              },
              {
                industry: "HVAC",
                avgPrice: 1500,
                missedCalls: 6,
                conversionRate: 20,
              },
              {
                industry: "Roofing",
                avgPrice: 5000,
                missedCalls: 4,
                conversionRate: 25,
              },
              {
                industry: "Med Spa",
                avgPrice: 200,
                missedCalls: 15,
                conversionRate: 12,
              },
              {
                industry: "Dental",
                avgPrice: 150,
                missedCalls: 12,
                conversionRate: 14,
              },
            ].map((example) => {
              const starterRevenue = (10 * example.conversionRate * example.avgPrice) / 100;
              const breakeven = Math.ceil((49 / (example.avgPrice * (example.conversionRate / 100))) || 1);
              return (
                <div key={example.industry} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{example.industry}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg job: ${example.avgPrice.toLocaleString()} | Typical conversion: {example.conversionRate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">{breakeven}</p>
                      <p className="text-xs text-muted-foreground">leads to break even</p>
                      <p className="text-xs font-medium text-green-600 mt-1">
                        ~${Math.round(starterRevenue)} profit/mo on 10 calls
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4">
            <h4 className="font-semibold text-sm text-orange-900 mb-2">💡 Why This Matters</h4>
            <ul className="space-y-1 text-sm text-orange-900">
              <li>• <strong>Lawn care at $40/job?</strong> Just 2 converted calls and you paid for the whole month.</li>
              <li>• <strong>HVAC at $1,500?</strong> Even recovering just 1 qualified lead in 6 months pays for a year.</li>
              <li>• <strong>The kicker:</strong> Most businesses get 5-15 missed calls per month. You're probably leaving $500-2,000 on the table right now.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Sales Pitch */}
      <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">🎯 How To Sell This</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">For Budget-Conscious Prospects</h4>
            <p className="text-sm leading-relaxed">
              "Look at it this way: you get <strong>10 missed calls a month</strong> on average. If even 1-2 of those are real customers and you can convert them, the plan pays for itself. Everything after that is profit. For $49 a month, that's incredibly low risk."
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">For High-Ticket Service Businesses</h4>
            <p className="text-sm leading-relaxed">
              "A single HVAC job is worth $1,500+. If this system helps you recover just <strong>one qualified lead every 6 months</strong>, you've made back your annual investment 100x over. That's the ROI we're talking about."
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">For Scaling Operations</h4>
            <p className="text-sm leading-relaxed">
              "Growth and Pro plans let your team handle more leads. As you scale, your cost per recovered lead actually <strong>goes down</strong> while your total profit scales up. This is how you hit 6 figures without hiring expensive sales staff."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}