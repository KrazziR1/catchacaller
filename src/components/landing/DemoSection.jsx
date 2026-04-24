import { motion } from 'framer-motion';
import InteractiveDemo from './InteractiveDemo';

export default function DemoSection() {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-3">Demo</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            See it in action
          </h2>
          <p className="text-lg text-muted-foreground mt-4">
            Watch how CatchACaller recovers a missed call in 60 seconds
          </p>
        </motion.div>

        <InteractiveDemo />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl"
        >
          <p className="text-sm text-center text-muted-foreground">
            💡 <span className="font-semibold text-foreground">Pro tip:</span> Most users see first booking within 24 hours of activation
          </p>
        </motion.div>
      </div>
    </section>
  );
}