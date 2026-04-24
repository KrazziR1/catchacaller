import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useState } from 'react';

export default function DemoSection() {
  const [playing, setPlaying] = useState(false);

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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-black"
        >
          {/* Placeholder for video */}
          <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative">
            <button
              onClick={() => setPlaying(!playing)}
              className="relative w-20 h-20 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors flex items-center justify-center group"
            >
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              <Play className="w-8 h-8 text-primary fill-primary ml-1" />
            </button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {!playing && (
                <div className="text-center">
                  <p className="text-white/60 text-sm">Click to play demo video</p>
                  <p className="text-white/40 text-xs mt-2">iframe: Replace with your Loom/YouTube embed</p>
                </div>
              )}
            </div>
          </div>

          {/* Feature callouts */}
          <div className="grid sm:grid-cols-3 gap-4 p-6 bg-card/50 border-t border-border">
            <div>
              <p className="text-xs font-semibold text-primary mb-1">⚡ Real-time</p>
              <p className="text-sm text-muted-foreground">SMS sent in 2-5 seconds</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-1">🎯 Conversational</p>
              <p className="text-sm text-muted-foreground">AI qualifies the lead naturally</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-1">📅 Booking</p>
              <p className="text-sm text-muted-foreground">Direct calendar integration</p>
            </div>
          </div>
        </motion.div>

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