import { motion } from "framer-motion";
import { 
  Zap, Brain, BarChart3, Clock, 
  Shield, Smartphone, Users, TrendingUp 
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Response",
    description: "SMS sent within seconds of a missed call. Speed wins customers.",
  },
  {
    icon: Brain,
    title: "AI Conversations",
    description: "Natural, human-like SMS conversations that qualify and convert leads.",
  },
  {
    icon: Clock,
    title: "Smart Follow-ups",
    description: "Automated multi-step follow-ups if the lead doesn't respond immediately.",
  },
  {
    icon: BarChart3,
    title: "Revenue Tracking",
    description: "See exactly how much revenue your recovered calls generate.",
  },
  {
    icon: Shield,
    title: "SMS Compliance",
    description: "Built-in A2P compliance, opt-out handling, and message regulations.",
  },
  {
    icon: Smartphone,
    title: "Manual Takeover",
    description: "Jump into any conversation when the AI needs a human touch.",
  },
  {
    icon: Users,
    title: "Lead Qualification",
    description: "AI identifies service type, urgency, and value before you engage.",
  },
  {
    icon: TrendingUp,
    title: "ROI Dashboard",
    description: "Clear metrics on calls recovered, bookings made, and revenue earned.",
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
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
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