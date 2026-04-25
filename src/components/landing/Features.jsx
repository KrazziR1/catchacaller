import { motion } from "framer-motion";
import { 
  Zap, Brain, BarChart3, Clock, 
  Shield, Smartphone, Users, TrendingUp,
  Workflow, Calendar, Lock
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Live Call Forwarding",
    description: "Incoming calls ring your personal cell instantly. If you miss it, SMS follows within 2 seconds.",
  },
  {
    icon: Zap,
    title: "Automatic SMS Fallback",
    description: "When you don't answer, AI sends a friendly message keeping the lead warm.",
  },
  {
    icon: Brain,
    title: "Smart Conversations",
    description: "AI qualifies leads, schedules appointments, and converts on autopilot.",
  },
  {
    icon: BarChart3,
    title: "ROI Tracking",
    description: "See exactly which calls were recovered and revenue generated.",
  },
  {
    icon: Shield,
    title: "Built-in Compliance",
    description: "TCPA-compliant SMS, opt-out handling, state regulations enforced.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members, assign conversations, manage from one dashboard.",
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl border bg-card border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2 text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}