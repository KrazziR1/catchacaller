import { motion } from "framer-motion";
import { 
  Zap, Brain, BarChart3, Clock, 
  Shield, Smartphone, Users, TrendingUp,
  Workflow, Calendar, Lock
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Response",
    description: "SMS sent within seconds of a missed call. Speed wins customers.",
    tier: "all",
  },
  {
    icon: Brain,
    title: "AI Conversations",
    description: "Natural, human-like SMS conversations that qualify and convert leads.",
    tier: "all",
  },
  {
    icon: Clock,
    title: "Smart Follow-ups",
    description: "Automated multi-step follow-ups if the lead doesn't respond immediately.",
    tier: "all",
  },
  {
    icon: BarChart3,
    title: "Revenue Tracking",
    description: "See exactly how much revenue your recovered calls generate.",
    tier: "all",
  },
  {
    icon: Shield,
    title: "SMS Compliance",
    description: "Built-in A2P compliance, opt-out handling, and message regulations.",
    tier: "all",
  },
  {
    icon: Smartphone,
    title: "Manual Takeover",
    description: "Jump into any conversation when the AI needs a human touch.",
    tier: "all",
  },
  {
    icon: Users,
    title: "Lead Qualification",
    description: "AI identifies service type, urgency, and value before you engage.",
    tier: "all",
  },
  {
    icon: TrendingUp,
    title: "ROI Dashboard",
    description: "Clear metrics on calls recovered, bookings made, and revenue earned.",
    tier: "all",
  },
  {
    icon: Workflow,
    title: "CRM Pipeline (Growth+)",
    description: "Track leads through sales stages: new → contacted → qualified → won.",
    tier: "growth",
  },
  {
    icon: Users,
    title: "Team Collaboration (Growth+)",
    description: "Invite team members, assign conversations, and manage permissions.",
    tier: "growth",
  },
  {
    icon: Workflow,
    title: "CRM Integrations (Growth+)",
    description: "Sync leads to HubSpot, Salesforce, or Zapier automatically.",
    tier: "growth",
  },
  {
    icon: Calendar,
    title: "Calendar Booking (Pro)",
    description: "Automated appointment scheduling and confirmation with your booking link.",
    tier: "pro",
  },
  {
    icon: BarChart3,
    title: "Pipeline Analytics (Growth+)",
    description: "Conversion funnel, win rates, and lead-stage distribution analytics.",
    tier: "growth",
  },
  {
    icon: Zap,
    title: "Templated SMS (Growth+)",
    description: "Save and send pre-written templates with bulk SMS functionality.",
    tier: "growth",
  },
  {
    icon: Smartphone,
    title: "Lead Scoring (Growth+)",
    description: "AI-powered urgency scoring based on engagement, recency, and value.",
    tier: "growth",
  },
];

export default function Features() {
  return (
    <section className="py-24 lg:py-32 bg-muted/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">Features</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Everything you need to<br />recover lost revenue
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group p-6 rounded-2xl border transition-all duration-300 ${
                feature.tier === "growth"
                  ? "bg-blue-50/50 border-blue-200/50 hover:border-blue-300"
                  : feature.tier === "pro"
                  ? "bg-purple-50/50 border-purple-200/50 hover:border-purple-300"
                  : "bg-card border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                feature.tier === "growth"
                  ? "bg-blue-100 group-hover:bg-blue-200"
                  : feature.tier === "pro"
                  ? "bg-purple-100 group-hover:bg-purple-200"
                  : "bg-primary/10 group-hover:bg-primary/20"
              }`}>
                <feature.icon className={`w-6 h-6 ${
                  feature.tier === "growth"
                    ? "text-blue-600"
                    : feature.tier === "pro"
                    ? "text-purple-600"
                    : "text-primary"
                }`} />
              </div>
              <h3 className="font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}