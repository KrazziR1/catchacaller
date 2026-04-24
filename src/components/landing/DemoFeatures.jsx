import { motion } from 'framer-motion';
import { 
  CheckCircle2, MessageCircle, BarChart2, Cloud, CreditCard, Calendar, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const integrations = [
  { name: 'Twilio', tier: 'all', icon: MessageCircle, color: 'bg-red-100 border-red-300' },
  { name: 'HubSpot', tier: 'growth', icon: BarChart2, color: 'bg-orange-100 border-orange-300' },
  { name: 'Salesforce', tier: 'growth', icon: Cloud, color: 'bg-blue-100 border-blue-300' },
  { name: 'Zapier', tier: 'growth', icon: Zap, color: 'bg-yellow-100 border-yellow-300' },
  { name: 'Stripe', tier: 'growth', icon: CreditCard, color: 'bg-purple-100 border-purple-300' },
  { name: 'Google Calendar', tier: 'pro', icon: Calendar, color: 'bg-green-100 border-green-300' },
];

export default function DemoFeatures() {
  return (
    <div className="mt-16 space-y-16">
      {/* Integrations Grid */}
      <div className="border-t border-border pt-12">
        <div className="mb-10">
          <h3 className="text-2xl font-bold mb-3">Integrations & Partnerships</h3>
          <p className="text-muted-foreground">Connect your entire business ecosystem</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration, i) => {
            const Icon = integration.icon;
            const tierLabels = {
              all: 'All Plans',
              growth: 'Growth+',
              pro: 'Pro',
            };
            const iconColors = {
              all: 'text-red-600',
              growth: 'text-orange-600',
              pro: 'text-green-600',
            };

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-4 rounded-lg border ${integration.color}`}
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <Icon className={`w-6 h-6 ${iconColors[integration.tier]}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900">{integration.name}</p>
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