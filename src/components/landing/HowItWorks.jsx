import { motion } from "framer-motion";
import { PhoneMissed, Zap, MessageSquare, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: PhoneMissed,
    title: "Missed Call Detected",
    description: "Our system instantly detects when a call goes unanswered—no hardware needed.",
    accent: "destructive",
  },
  {
    icon: Zap,
    title: "AI Responds in Seconds",
    description: "A smart, personalized SMS is sent within 5 seconds—before they call a competitor.",
    accent: "primary",
  },
  {
    icon: MessageSquare,
    title: "AI Conversation Begins",
    description: "Our AI engages the lead naturally, qualifies their needs, and builds intent.",
    accent: "chart-3",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Booked",
    description: "The lead is guided to book directly. You get a new customer without lifting a finger.",
    accent: "accent",
  },
];

const accentMap = {
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  primary: "bg-primary/10 text-primary border-primary/20",
  "chart-3": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  accent: "bg-accent/10 text-accent border-accent/20",
};

const lineMap = {
  destructive: "bg-destructive/30",
  primary: "bg-primary/30",
  "chart-3": "bg-purple-500/30",
  accent: "bg-accent/30",
};

export default function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">How It Works</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            From missed call to booked job<br />in under 60 seconds
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className={`hidden lg:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 ${lineMap[step.accent]}`} />
              )}
              <div className="text-center">
                <div className={`w-20 h-20 rounded-2xl border ${accentMap[step.accent]} flex items-center justify-center mx-auto mb-6`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}