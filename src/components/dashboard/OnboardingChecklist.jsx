import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Phone, Settings, MessageSquare, Send } from 'lucide-react';

const steps = [
  { id: 'phone', label: 'Provision Phone Number', icon: Phone, check: (p) => !!p.phone_number && !!p.twilio_number_sid },
  { id: 'ai', label: 'Set AI Personality', icon: Settings, check: (p) => !!p.ai_personality },
  { id: 'templates', label: 'Create SMS Templates', icon: MessageSquare, check: (t) => t && t.length > 0 },
  { id: 'first_message', label: 'Send First SMS', icon: Send, check: (c) => c && c.length > 0 },
];

export default function OnboardingChecklist({ profile, templates, conversations }) {
  const completed = [
    steps[0].check(profile || {}),
    steps[1].check(profile || {}),
    steps[2].check(templates),
    steps[3].check(conversations),
  ];

  const completedCount = completed.filter(Boolean).length;
  const progress = Math.round((completedCount / completed.length) * 100);

  if (completedCount === completed.length) return null; // Hide when complete

  return (
    <Card className="rounded-2xl border-primary/20 bg-primary/5 mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Setup Progress</CardTitle>
          <Badge variant="outline">{completedCount}/{completed.length} Complete</Badge>
        </div>
        <div className="mt-3 w-full bg-muted rounded-full h-2">
          <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              {completed[i] ? (
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
              )}
              <span className={`text-sm ${completed[i] ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}