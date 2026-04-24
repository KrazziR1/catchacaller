import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Phone, MessageCircle, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const demoStages = [
  {
    id: 'missed-call',
    title: 'Missed Call Detected',
    duration: 6,
    content: {
      phone: '(312) 555-0147',
      name: 'Sarah Martinez',
      time: '2:34 PM',
      source: 'Google Ads',
      serviceType: 'HVAC Repair',
    },
    display: (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg border border-red-500/30">
          <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center animate-pulse">
            <Phone className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="font-bold text-white">Incoming Call</p>
            <p className="text-sm text-red-200">(312) 555-0147</p>
            <p className="text-xs text-red-300 mt-1">Missed at 2:34 PM</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-800/50 p-3 rounded-lg">
            <p className="text-xs text-slate-400">Caller</p>
            <p className="font-semibold text-white">Sarah Martinez</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg">
            <p className="text-xs text-slate-400">Source</p>
            <p className="font-semibold text-white">Google Ads</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg col-span-2">
            <p className="text-xs text-slate-400">Service Type</p>
            <p className="font-semibold text-white">HVAC System Repair</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center">⏱️ System analyzing...</p>
      </div>
    ),
  },
  {
    id: 'auto-sms',
    title: 'AI Sends Instant Response',
    duration: 6,
    content: {
      message: "Hi Sarah! 👋 Thanks for calling. We're ReliableCool HVAC. Can't get you now, but I'd love to help with your AC issue. What's going on?",
    },
    display: (
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
            <p className="text-white text-sm">Hi Sarah! 👋 Thanks for calling. We're ReliableCool HVAC. Can't get you now, but I'd love to help with your AC issue. What's going on?</p>
            <p className="text-xs text-slate-400 mt-2">2:34 PM</p>
          </div>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
          <p className="text-xs font-semibold text-green-300">✓ Sent in 2.8 seconds</p>
          <p className="text-xs text-green-200 mt-1">Lead is receiving message now...</p>
        </div>
      </div>
    ),
  },
  {
    id: 'lead-responds',
    title: 'Lead Responds & Qualifies',
    duration: 7,
    content: {
      leadMessage: 'Yes, AC is blowing warm air. Need someone ASAP, probably need a full repair.',
      qualification: {
        urgency: 'High',
        estimated: '$1200-1800',
        score: 92,
      },
    },
    display: (
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="bg-slate-600 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
            <p className="text-white text-sm">Yes, AC is blowing warm air. Need someone ASAP, probably need a full repair.</p>
            <p className="text-xs text-slate-300 mt-2">2:36 PM</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-300 font-semibold">High</p>
            <p className="text-red-200 text-xs mt-1">Urgency</p>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
            <p className="text-blue-300 font-semibold">$1.4K</p>
            <p className="text-blue-200 text-xs mt-1">Est. Value</p>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3">
            <p className="text-purple-300 font-semibold">92</p>
            <p className="text-purple-200 text-xs mt-1">Lead Score</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center">🤖 AI handling conversation naturally...</p>
      </div>
    ),
  },
  {
    id: 'ai-closes',
    title: 'AI Moves to Booking',
    duration: 6,
    content: {
      message: "Got it! We have openings today at 3:30 PM or tomorrow at 9 AM. Which works better? I can book you in right now.",
    },
    display: (
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
            <p className="text-white text-sm">Got it! We have openings today at 3:30 PM or tomorrow at 9 AM. Which works better? I can book you in right now.</p>
            <p className="text-xs text-slate-400 mt-2">2:37 PM</p>
          </div>
        </div>
        <div className="bg-accent/20 border border-accent/50 rounded-lg p-3">
          <p className="text-xs text-accent font-semibold">📅 Calendar integration active</p>
          <p className="text-xs text-slate-300 mt-1">Presenting available time slots from your calendar</p>
        </div>
      </div>
    ),
  },
  {
    id: 'booking-confirmed',
    title: 'Booking Confirmed',
    duration: 6,
    content: {
      booking: {
        time: 'Today, 3:30 PM',
        duration: '45 min',
        status: 'Confirmed',
      },
    },
    display: (
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="bg-primary rounded-2xl rounded-tr-none px-4 py-3 max-w-xs">
            <p className="text-white text-sm">Yes! 3:30 PM today works. Thank you!</p>
            <p className="text-xs text-primary-foreground/70 mt-2">2:38 PM</p>
          </div>
        </div>
        <div className="bg-accent/20 border border-accent rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            <p className="font-semibold text-white">Booking Confirmed</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs mt-3">
            <div>
              <p className="text-slate-400">Time</p>
              <p className="font-semibold text-white">Today, 3:30 PM</p>
            </div>
            <div>
              <p className="text-slate-400">Duration</p>
              <p className="font-semibold text-white">45 minutes</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-accent/30">✓ Confirmation SMS sent to Sarah</p>
        </div>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: 'Dashboard Impact',
    duration: 8,
    content: {},
    display: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-300">From Missed Call</p>
            <p className="text-xl font-bold text-blue-200">→ Booked</p>
            <p className="text-xs text-blue-200 mt-2">4 mins total</p>
          </div>
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-300">Revenue Tracked</p>
            <p className="text-xl font-bold text-green-200">$1,400</p>
            <p className="text-xs text-green-200 mt-2">Est. job value</p>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 text-center">
            <p className="text-xs text-purple-300">Next in Pipeline</p>
            <p className="text-xl font-bold text-purple-200">Scheduled</p>
            <p className="text-xs text-purple-200 mt-2">Auto-confirmed</p>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 border border-slate-700">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Team Visibility (Growth+)</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Assigned to:</span>
              <span className="font-semibold text-white">Mike Rodriguez (Owner)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Status:</span>
              <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-xs font-semibold">Contacted</span>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-300">🎯 Pro Tip</p>
          <p className="text-xs text-amber-200 mt-1">All conversation history, notes, and booking details synced to HubSpot (CRM Integration)</p>
        </div>
      </div>
    ),
  },
];

export default function InteractiveDemo() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const currentStage = demoStages[step];
    const totalDuration = currentStage.duration * 1000;
    let elapsed = 0;
    const startTime = Date.now();

    const interval = setInterval(() => {
      elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(percent);

      if (percent >= 100) {
        clearInterval(interval);
        if (step < demoStages.length - 1) {
          setStep(step + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
          setStep(0);
          setProgress(0);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, step]);

  const currentStage = demoStages[step];

  return (
    <div className="space-y-6">
      {/* Demo Display */}
      <div className="relative rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 min-h-96">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700 rounded-t-2xl overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        {/* Stage Title & Number */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Step {step + 1} of {demoStages.length}
            </p>
            <h3 className="text-xl font-bold text-white">{currentStage.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {demoStages.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : i < step ? 'w-2 bg-accent' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-64 flex flex-col justify-center"
          >
            {currentStage.display}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (!isPlaying && step === demoStages.length - 1) {
                setStep(0);
                setProgress(0);
              }
            }}
            variant={isPlaying ? 'default' : 'outline'}
            size="sm"
            className="rounded-lg"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play Demo
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              setStep(0);
              setProgress(0);
              setIsPlaying(false);
            }}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          {demoStages[step].duration}s · Full workflow from call to booking
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Recovery</p>
          <p className="text-lg font-bold text-primary">73%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Response</p>
          <p className="text-lg font-bold text-green-400">2-5 sec</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Close Rate</p>
          <p className="text-lg font-bold text-accent">68%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Avg Value</p>
          <p className="text-lg font-bold text-purple-400">$1.4K</p>
        </div>
      </div>
    </div>
  );
}