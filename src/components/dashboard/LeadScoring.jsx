import { differenceInHours } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LeadScoring({ conversation }) {
  // Calculate lead score (0-100)
  let score = 50; // baseline

  // Time since last message (fresher is better)
  if (conversation.last_message_at) {
    const hoursSinceMsg = differenceInHours(new Date(), new Date(conversation.last_message_at));
    if (hoursSinceMsg < 1) score += 20;
    else if (hoursSinceMsg < 24) score += 10;
    else if (hoursSinceMsg < 72) score += 5;
  }

  // Message engagement (more messages = more interest)
  const messageCount = conversation.messages?.length || 0;
  if (messageCount > 10) score += 15;
  else if (messageCount > 5) score += 10;
  else if (messageCount > 2) score += 5;

  // Pipeline stage value
  const stageScores = {
    'qualified': 20,
    'booked': 25,
    'won': 30,
    'contacted': 5,
    'new': 0,
    'lost': -20,
  };
  score = Math.max(0, score + (stageScores[conversation.pipeline_stage] || 0));

  // Follow-up count (more follow-ups = higher effort/value)
  const followUpBonus = Math.min((conversation.follow_up_count || 0) * 3, 10);
  score += followUpBonus;

  // Estimated value (higher value = higher score)
  if (conversation.estimated_value) {
    if (conversation.estimated_value > 1000) score += 10;
    else if (conversation.estimated_value > 500) score += 5;
  }

  score = Math.min(100, score);

  const getUrgencyColor = (score) => {
    if (score >= 80) return 'bg-destructive/10 text-destructive';
    if (score >= 60) return 'bg-orange-500/10 text-orange-600';
    if (score >= 40) return 'bg-yellow-500/10 text-yellow-600';
    return 'bg-muted text-muted-foreground';
  };

  const getUrgencyLabel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="flex items-center gap-2">
      <AlertCircle className="w-4 h-4 text-muted-foreground" />
      <Badge className={getUrgencyColor(score)}>
        {getUrgencyLabel(score)} ({score})
      </Badge>
    </div>
  );
}