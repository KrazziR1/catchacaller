import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How quickly does it respond to missed calls?',
    a: 'SMS is sent within 2-5 seconds of a missed call. This speed is crucial—most leads expect a response within minutes.',
  },
  {
    q: 'Does it integrate with my CRM?',
    a: 'Yes! Growth+ and Pro plans sync automatically to HubSpot, Salesforce, and Zapier. Starter tracks everything in our platform.',
  },
  {
    q: 'Is this compliant with SMS laws?',
    a: 'Absolutely. Built-in A2P compliance, automatic opt-out handling, and full TCPA adherence. We handle the legal side.',
  },
  {
    q: 'What if I want to take over a conversation?',
    a: 'Jump in anytime. You can manually reply to any lead, and the AI will step back. Full control is always yours.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most businesses are fully operational in 1-2 hours. This includes claiming your toll-free number (which requires carrier verification), setting up your templates, and testing. If you already have a number, it\'s just 15-20 minutes.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel your subscription anytime—no contracts, no hidden fees. Month-to-month billing with full transparency.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">FAQ</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Questions answered
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-border rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-6 hover:bg-muted/50 transition-colors text-left"
              >
                <span className="font-semibold text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border px-6 py-4 bg-muted/30"
                >
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}