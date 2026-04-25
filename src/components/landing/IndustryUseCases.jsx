import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { handleTrial } from '@/lib/handleTrial';

const useCases = [
  {
    industry: 'HVAC',
    icon: '❄️',
    problem: 'Customer calls for AC repair at 2:30 PM but office is busy',
    before: { recovery: '0%', bookingRate: '0%', revenue: '$0', time: 'Missed' },
    after: { recovery: '73%', bookingRate: '68%', revenue: '$1,050', time: '4 mins' },
    details: 'AI qualifies urgency (high), sends availability, books $1,500 job in minutes.',
  },
  {
    industry: 'Plumbing',
    icon: '🔧',
    problem: 'Urgent water leak call missed during lunch break',
    before: { recovery: '0%', bookingRate: '0%', revenue: '$0', time: 'Missed' },
    after: { recovery: '73%', bookingRate: '68%', revenue: '$750', time: '2 mins' },
    details: 'AI recognizes emergency urgency, prioritizes response, books $1,100 emergency call.',
  },
  {
    industry: 'Dental',
    icon: '🦷',
    problem: 'Cosmetic consultation inquiry missed',
    before: { recovery: '0%', bookingRate: '0%', revenue: '$0', time: 'Missed' },
    after: { recovery: '73%', bookingRate: '68%', revenue: '$400', time: '3 mins' },
    details: 'AI captures lead info, qualifies service type, books consultation appointment.',
  },
];

export default function IndustryUseCases() {
  const [loading, setLoading] = useState(false);

  return (
    <section className="py-24 lg:py-32 bg-muted/50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">Industry Solutions</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Real results across trades
          </h2>
          <p className="text-lg text-muted-foreground mt-4">
            See how different industries recover lost revenue with CatchACaller
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {useCases.map((useCase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-3xl mb-2 inline-block">{useCase.icon}</span>
                    <h3 className="text-xl font-bold">{useCase.industry}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{useCase.problem}</p>
              </div>

              {/* Before/After */}
              <div className="p-6 space-y-6">
                {/* Before */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Without CatchACaller</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-destructive/10 rounded-lg p-3">
                      <p className="text-xs text-destructive/70 mb-1">Recovery Rate</p>
                      <p className="text-xl font-bold text-destructive">{useCase.before.recovery}</p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-3">
                      <p className="text-xs text-destructive/70 mb-1">Booking Rate</p>
                      <p className="text-xl font-bold text-destructive">{useCase.before.bookingRate}</p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-destructive/70 mb-1">Revenue Per Missed Call</p>
                      <p className="text-2xl font-bold text-destructive">{useCase.before.revenue}</p>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-primary rotate-90" />
                </div>

                {/* After */}
                <div>
                  <p className="text-xs font-semibold text-accent uppercase mb-3">With CatchACaller</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-accent/10 rounded-lg p-3">
                      <p className="text-xs text-accent/70 mb-1">Recovery Rate</p>
                      <p className="text-xl font-bold text-accent">{useCase.after.recovery}</p>
                    </div>
                    <div className="bg-accent/10 rounded-lg p-3">
                      <p className="text-xs text-accent/70 mb-1">Booking Rate</p>
                      <p className="text-xl font-bold text-accent">{useCase.after.bookingRate}</p>
                    </div>
                    <div className="bg-accent/10 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-accent/70 mb-1">Revenue Per Lead</p>
                      <p className="text-2xl font-bold text-accent">{useCase.after.revenue}</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <p className="text-xs leading-relaxed text-foreground">{useCase.details}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <Button
            onClick={handleTrial}
            disabled={loading}
            size="lg"
            className="rounded-xl px-8 h-12 text-base shadow-lg shadow-primary/25"
          >
            {loading ? 'Redirecting...' : 'Start Your Free Trial'} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">7-day free trial. No credit card required.</p>
        </motion.div>
      </div>
    </section>
  );
}