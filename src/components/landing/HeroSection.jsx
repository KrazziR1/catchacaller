import { motion } from "framer-motion";
import { ArrowRight, PhoneMissed, MessageSquare, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] animate-pulse-glow" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-primary">Your Phone + AI Backup</span>
            </div>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Your calls.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Answered. Always.
            </span>
          </h1>
          
          <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
            When you're free, you pick up. When you're busy, AI answers and qualifies the lead. No missed calls. No voicemail walls. Just qualified leads in your inbox.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-10">
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              onClick={() => base44.auth.redirectToLogin("/onboarding")}
            >
              Start Your 7-Day Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold rounded-xl" onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}>
              See It In Action
            </Button>
          </div>
          
          <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
             <span className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-accent" />
               Just $2.99 to get started
             </span>
             <span className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-accent" />
               1-2 day Twilio activation
             </span>
             <span className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-accent" />
               Cancel anytime
             </span>
           </div>
        </motion.div>
        
        {/* Phone mockup / flow visualization */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="hidden lg:block"
        >
          <div className="relative">
            {/* Phone frame */}
            <div className="w-[320px] mx-auto bg-card rounded-[2.5rem] border-2 border-border p-3 shadow-2xl">
              <div className="bg-background rounded-[2rem] overflow-hidden">
                <div className="h-8 bg-muted flex items-center justify-center">
                  <div className="w-20 h-1 rounded-full bg-border" />
                </div>
                <div className="p-4 space-y-3">
                  {/* Incoming call notification */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
                  >
                    <PhoneMissed className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs font-semibold">Incoming Call</p>
                      <p className="text-xs text-muted-foreground">(555) 123-4567 • Now ringing</p>
                    </div>
                  </motion.div>
                  
                  {/* You didn't answer */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted"
                  >
                    <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold">AI Takes Over</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        "Hi! How can we help? We have availability this afternoon."
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Lead Reply */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.6 }}
                    className="ml-8 p-3 rounded-xl bg-muted"
                  >
                    <p className="text-xs">"I need to book an appointment ASAP"</p>
                  </motion.div>
                  
                  {/* Booking */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3.4 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20"
                  >
                    <CalendarCheck className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-xs font-semibold text-accent">Appointment Booked!</p>
                      <p className="text-xs text-muted-foreground">Today, 2:00 PM - Consultation</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute -left-8 top-20 bg-card border border-border rounded-xl px-4 py-2 shadow-lg"
            >
              <p className="text-xs font-mono text-accent font-semibold">⚡ 3s response</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.8 }}
              className="absolute -right-8 bottom-20 bg-card border border-border rounded-xl px-4 py-2 shadow-lg"
            >
              <p className="text-xs font-semibold">+$850 recovered</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}