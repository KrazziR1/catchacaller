import { motion } from 'framer-motion';

const integrations = [
  { name: 'Twilio', logo: '📞', color: 'from-red-500/20 to-red-600/20' },
  { name: 'HubSpot', logo: '🎯', color: 'from-orange-500/20 to-orange-600/20' },
  { name: 'Salesforce', logo: '☁️', color: 'from-blue-500/20 to-blue-600/20' },
  { name: 'Zapier', logo: '⚡', color: 'from-yellow-500/20 to-yellow-600/20' },
  { name: 'Stripe', logo: '💳', color: 'from-indigo-500/20 to-indigo-600/20' },
  { name: 'Google Calendar', logo: '📅', color: 'from-green-500/20 to-green-600/20' },
];

export default function IntegrationsSection() {
  return (
    <section className="py-24 lg:py-32 bg-muted/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">Integrations</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Works with your stack
          </h2>
          <p className="text-lg text-muted-foreground mt-4">
            Seamlessly connect to the tools you already use
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((integ, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`bg-gradient-to-br ${integ.color} border border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-shadow`}
            >
              <span className="text-4xl">{integ.logo}</span>
              <span className="text-sm font-semibold text-center">{integ.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}