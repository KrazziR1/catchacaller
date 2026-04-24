import { motion } from 'framer-motion';
import { 
  Zap, MessageSquare, BarChart3, 
  Smartphone, Lock, Brain, 
  Calendar, Zap as Integration 
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Response',
    description: 'SMS sent within 2-5 seconds',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Brain,
    title: 'AI Qualification',
    description: 'Naturally qualifies leads',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: MessageSquare,
    title: 'Natural Conversations',
    description: 'Human-like SMS dialogue',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: Calendar,
    title: 'Auto Booking',
    description: 'Direct calendar sync',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: BarChart3,
    title: 'ROI Tracking',
    description: 'Measure every recovered call',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: Lock,
    title: 'Compliance Ready',
    description: 'A2P certified & opt-out handling',
    color: 'from-red-500 to-red-600',
  },
];

const integrations = [
  { name: 'HubSpot', emoji: '🎯' },
  { name: 'Salesforce', emoji: '☁️' },
  { name: 'Zapier', emoji: '⚡' },
  { name: 'Google Calendar', emoji: '📅' },
  { name: 'Calendly', emoji: '📆' },
  { name: 'Twilio', emoji: '📱' },
];

export default function DemoFeatures() {
  return (
    <div className="mt-12 space-y-12">
      {/* Key Features */}
      <div>
        <h3 className="text-xl font-bold text-center mb-8">Built-in Capabilities</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-white text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-slate-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Integrations */}
      <div className="border-t border-slate-700 pt-8">
        <h3 className="text-xl font-bold text-center mb-8">Integrations & Partners</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {integrations.map((integration, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all hover:bg-slate-800"
            >
              <span className="text-lg mr-2">{integration.emoji}</span>
              <span className="text-sm font-medium text-slate-200">{integration.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}