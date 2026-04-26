import { motion } from 'framer-motion';

const integrations = [
  {
    name: 'Twilio',
    logo: 'https://www.twilio.com/content/dam/twilio-com/global/en/blog/legacy/2018/twilio-logo-red.png',
    color: 'from-red-500/10 to-red-600/10',
    description: 'SMS & calls',
    supported: true,
  },
  {
    name: 'Stripe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    color: 'from-indigo-500/10 to-indigo-600/10',
    description: 'Billing',
    supported: true,
  },
  {
    name: 'HubSpot',
    logo: 'https://www.hubspot.com/hubfs/assets/hubspot.com/buzz/HubSpotOpenGraph.png',
    color: 'from-orange-500/10 to-orange-600/10',
    description: 'CRM sync',
    supported: true,
  },
  {
    name: 'Zapier',
    logo: 'https://images.ctfassets.net/lzny33ho1g45/4NfMSLrmodeGMWyasKEsOS/b3d49576af0d14a769e9d5aeacd2dc46/Zapier_logo.png',
    color: 'from-orange-400/10 to-yellow-500/10',
    description: 'Automations',
    supported: true,
  },
  {
    name: 'Salesforce',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
    color: 'from-blue-500/10 to-blue-600/10',
    description: 'CRM sync',
    supported: true,
  },
  {
    name: 'Google Calendar',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
    color: 'from-green-500/10 to-green-600/10',
    description: 'Booking sync',
    supported: true,
  },
];

export default function IntegrationsSection() {
  return (
    <section id="integrations" className="py-24 lg:py-32 bg-muted/50">
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
              className={`bg-gradient-to-br ${integ.color} border border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-shadow bg-card`}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src={integ.logo}
                  alt={integ.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="hidden w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                  <span className="text-xs font-bold text-primary">{integ.name[0]}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{integ.name}</p>
                <p className="text-xs text-muted-foreground">{integ.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All integrations are live and production-ready. HubSpot, Salesforce & Zapier available on Growth+ plans.
        </p>
      </div>
    </section>
  );
}