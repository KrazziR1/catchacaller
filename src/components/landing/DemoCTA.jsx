import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';

export default function DemoCTA() {
  const [loading, setLoading] = useState(false);

  const handleTrial = async () => {
    setLoading(true);
    const isAuthed = await base44.auth.isAuthenticated();
    if (!isAuthed) {
      base44.auth.redirectToLogin('/onboarding');
      return;
    }
    window.location.href = '/onboarding';
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-16 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-y border-primary/20"
    >
      <div className="max-w-4xl mx-auto px-6 text-center">
        <Zap className="w-8 h-8 text-primary mx-auto mb-4" />
        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
          Ready to recover lost revenue?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join hundreds of businesses already capturing missed calls. Set up in 15-20 minutes.
        </p>
        <Button
          onClick={handleTrial}
          disabled={loading}
          size="lg"
          className="rounded-xl px-8 h-12 text-base shadow-lg shadow-primary/25"
        >
          {loading ? 'Redirecting...' : 'Start Free Trial'} <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">7 days free. No credit card needed.</p>
      </div>
    </motion.section>
  );
}