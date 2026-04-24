import { motion } from 'framer-motion';
import { Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactSection() {
  return (
    <section className="py-24 lg:py-32 bg-muted/50">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">Support</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Questions? We're here to help
          </h2>
          <p className="text-lg text-muted-foreground mt-4">
            Get in touch with our team—response time under 2 hours
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          <motion.a
            href="mailto:contact@catchacaller.com"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group p-8 rounded-2xl border border-border hover:border-primary/50 bg-card hover:bg-card/80 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">Email Us</h3>
            <p className="text-sm text-muted-foreground mb-4">
              contact@catchacaller.com
            </p>
            <p className="text-xs text-primary font-semibold">Response in &lt; 2 hours →</p>
          </motion.a>

          <motion.a
            href="mailto:contact@catchacaller.com?subject=I%20want%20to%20start%20a%20free%20trial"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group p-8 rounded-2xl border border-border hover:border-accent/50 bg-card hover:bg-card/80 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center mb-4 transition-colors">
              <MessageCircle className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-bold mb-2">Start Free Trial</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started with your 30-day free trial
            </p>
            <p className="text-xs text-accent font-semibold">Email us to activate →</p>
          </motion.a>
        </div>
      </div>
    </section>
  );
}