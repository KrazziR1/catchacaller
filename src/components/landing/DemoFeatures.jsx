import { motion } from 'framer-motion';
import { 
  Zap, Brain, MessageSquare, Calendar, 
  BarChart3, Lock, Users, Workflow,
  TrendingUp, CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const capabilities = [
  {
    tier: 'all',
    icon: Zap,
    title: 'Instant 2-5 Second Response',
    description: 'SMS sent automatically within seconds of missed call. Speed is the difference between conversion and lost lead.',
    example: 'Call missed at 2:34 PM → SMS received at 2:34:03 PM',
  },
  {
    tier: 'all',
    icon: Brain,
    title: 'AI Conversation Handling',
    description: 'Natural, human-like SMS conversations that qualify leads, identify urgency, and move toward booking.',
    example: 'AI asks about service type, urgency, and availability—all naturally conversational.',
  },
  {
    tier: 'growth',
    icon: BarChart3,
    title: 'Lead Scoring & Pipeline',
    description: 'AI automatically scores leads 0-100. Track every conversation through your sales pipeline with visibility for your team.',
    example: 'Sarah Martinez: 92/100 score, High urgency, $1,400 estimated value, marked "Contacted"',
  },
  {
    tier: 'pro',
    icon: Calendar,
    title: 'Calendar Integration & Auto-Booking',
    description: 'AI presents available slots from your calendar and books appointments directly. No manual confirmation needed.',
    example: 'AI: "I have 3:30 PM today or 9 AM tomorrow open" → Customer books → Instant confirmation sent',
  },
  {
    tier: 'growth',
    icon: Users,
    title: 'Team Collaboration',
    description: 'Assign conversations to team members, set permissions, and manage roles. Perfect for multi-location or growing teams.',
    example: 'Admin assigns Sarah\'s booking to "Mike Rodriguez (Owner)" automatically via pipeline stage change',
  },
  {
    tier: 'growth',
    icon: Workflow,
    title: 'CRM Integrations',
    description: 'Sync every lead to HubSpot, Salesforce, or Zapier. No manual data entry—everything flows automatically.',
    example: 'Lead details, conversation history, booking time—all synced to your CRM in real-time',
  },
  {
    tier: 'all',
    icon: TrendingUp,
    title: 'ROI Dashboard',
    description: 'See exactly how many calls you recovered, bookings made, and revenue generated. Measure true impact.',
    example: '73% of missed calls recovered, 68% booking rate, $1,400 average value per lead',
  },
  {
    tier: 'all',
    icon: Lock,
    title: 'Compliance Ready',
    description: 'A2P certified SMS, automatic opt-out handling, message regulation compliance built-in.',
    example: 'Never worry about compliance—all SMS messaging meets carrier and regulatory standards',
  },
];

const integrations = [
  { name: 'HubSpot', tier: 'growth', emoji: '🎯' },
  { name: 'Salesforce', tier: 'growth', emoji: '☁️' },
  { name: 'Zapier', tier: 'growth', emoji: '⚡' },
  { name: 'Google Calendar', tier: 'pro', emoji: '📅' },
  { name: 'Calendly', tier: 'pro', emoji: '📆' },
  { name: 'Twilio', tier: 'all', emoji: '📱' },
];

export default function DemoFeatures() {
  return (
    <div className="mt-16 space-y-16">
      {/* Capabilities by Tier */}
      <div>
        <div className="mb-10">
          <h3 className="text-2xl font-bold mb-3">Capabilities at Every Tier</h3>
          <p className="text-muted-foreground">See what's included in Starter, Growth+, and Pro plans</p>
        </div>

        <div className="grid gap-6">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            const tierColors = {
              all: 'from-blue-500 to-blue-600',
              growth: 'from-purple-500 to-purple-600',
              pro: 'from-amber-500 to-amber-600',
            };
            const tierLabels = {
              all: 'All Plans',
              growth: 'Growth+',
              pro: 'Pro',
            };

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tierColors[cap.tier]} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-bold text-lg">{cap.title}</h4>
                      <Badge variant={cap.tier === 'all' ? 'secondary' : 'default'} className="shrink-0">
                        {tierLabels[cap.tier]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{cap.description}</p>
                    <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                      <p className="text-xs font-mono text-slate-400">
                        💡 <span className="text-foreground font-semibold">Example:</span> {cap.example}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="border-t border-border pt-12">
        <div className="mb-10">
          <h3 className="text-2xl font-bold mb-3">Integrations & Partnerships</h3>
          <p className="text-muted-foreground">Connect your entire business ecosystem</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration, i) => {
            const tierColors = {
              all: 'border-blue-200 bg-blue-50',
              growth: 'border-purple-200 bg-purple-50',
              pro: 'border-amber-200 bg-amber-50',
            };
            const tierLabels = {
              all: 'All Plans',
              growth: 'Growth+',
              pro: 'Pro',
            };

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-4 rounded-lg border ${tierColors[integration.tier]}`}
              >
                <span className="text-2xl">{integration.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{integration.name}</p>
                  <p className="text-xs text-slate-600">{tierLabels[integration.tier]}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Value Proposition */}
      <div className="border-t border-border pt-12 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl p-8">
        <h3 className="text-xl font-bold mb-6">Why Businesses Choose CatchACaller</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold text-primary mb-2">73%</p>
            <p className="text-sm text-muted-foreground">of missed calls recovered and converted</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-accent mb-2">2.8s</p>
            <p className="text-sm text-muted-foreground">average response time from missed call</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-500 mb-2">68%</p>
            <p className="text-sm text-muted-foreground">of qualified leads book appointments</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-500 mb-2">24h</p>
            <p className="text-sm text-muted-foreground">most customers see their first booking</p>
          </div>
        </div>
      </div>
    </div>
  );
}