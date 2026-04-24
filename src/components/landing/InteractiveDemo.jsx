import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InteractiveDemo() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = [
    {
      title: 'Missed Call',
      icon: Phone,
      message: 'Customer calls during off-hours',
      details: '+1 (555) 123-4567 called at 9:47 PM',
      color: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      title: 'Instant SMS Sent',
      icon: MessageCircle,
      message: 'AI sends personalized response',
      details: '"Hi John! Thanks for calling ABC HVAC. Quick question—are you looking for AC repair today?"',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      time: '2 seconds after missed call',
    },
    {
      title: 'Lead Engages',
      icon: MessageCircle,
      message: 'Customer replies naturally',
      details: '"Yes! My AC stopped working. Can I get someone out today?"',
      color: 'bg-amber-100',
      iconColor: 'text-amber-600',
      time: '3 minutes later',
    },
    {
      title: 'Booking Confirmed',
      icon: Calendar,
      message: 'Appointment scheduled',
      details: 'Tuesday 2:00 PM • Confirmation sent via SMS',
      color: 'bg-green-100',
      iconColor: 'text-green-600',
      time: '6 minutes after initial call',
    },
  ];

  const handlePlay = () => {
    setIsPlaying(true);
    setStep(0);
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setIsPlaying(false);
      } else {
        setStep(currentStep);
      }
    }, 4500);
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Demo Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-12"
      >
        {/* Timeline visualization */}
        <div className="mb-12">
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <motion.div
                  animate={{
                    scale: step === i ? 1.2 : 1,
                    boxShadow: step === i ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none',
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    step >= i
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {step > i ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </motion.div>
                <span className="text-xs text-slate-400 text-center hidden sm:block">
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <div className="flex mt-3">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 h-1 bg-slate-700 rounded-full"
                animate={{
                  backgroundColor: step > i ? '#3b82f6' : '#334155',
                }}
              />
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-8"
          >
            <motion.div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${currentStep.color}`}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
            >
              <Icon className={`w-8 h-8 ${currentStep.iconColor}`} />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h3>
            <p className="text-slate-300 mb-4">{currentStep.message}</p>
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-200 italic">"{currentStep.details}"</p>
            </div>
            {currentStep.time && (
              <p className="text-xs text-slate-400">{currentStep.time}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handlePlay}
            disabled={isPlaying}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {isPlaying ? 'Playing...' : 'Play Demo'}
          </Button>
          {step > 0 && (
            <Button
              onClick={() => setStep(0)}
              variant="outline"
              className="rounded-lg text-slate-200 border-slate-600"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Bottom info - better contrast */}
        <div className="mt-8 pt-6 border-t border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
          <div>
            <p className="font-semibold text-blue-400 mb-1">Recovery</p>
            <p className="text-lg font-bold text-white">73%</p>
          </div>
          <div>
            <p className="font-semibold text-green-400 mb-1">Response</p>
            <p className="text-lg font-bold text-white">2 sec</p>
          </div>
          <div>
            <p className="font-semibold text-purple-400 mb-1">AI Qualified</p>
            <p className="text-lg font-bold text-white">89%</p>
          </div>
          <div>
            <p className="font-semibold text-amber-400 mb-1">Avg Value</p>
            <p className="text-lg font-bold text-white">$850</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}