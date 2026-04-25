import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { differenceInHours } from 'date-fns';

export default function LeadScoringDistribution({ conversations = [] }) {
  const scoreDistribution = useMemo(() => {
    const ranges = {
      'Critical (80+)': 0,
      'High (60-79)': 0,
      'Medium (40-59)': 0,
      'Low (<40)': 0,
    };

    conversations.forEach(conv => {
      if (!conv || typeof conv !== 'object') return;
      
      let score = 50;

      if (conv.last_message_at) {
        try {
          const hoursSince = differenceInHours(new Date(), new Date(conv.last_message_at));
          if (hoursSince < 1) score += 20;
          else if (hoursSince < 24) score += 10;
          else if (hoursSince < 72) score += 5;
        } catch {
          // Invalid date, skip time bonus
        }
      }

      const msgCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
      if (msgCount > 10) score += 15;
      else if (msgCount > 5) score += 10;
      else if (msgCount > 2) score += 5;

      const stageScores = { qualified: 20, booked: 25, won: 30, contacted: 5, new: 0, lost: -20 };
      score = Math.max(0, score + (stageScores[conv.pipeline_stage] || 0));

      const followUpBonus = Math.min((conv.follow_up_count || 0) * 3, 10);
      score += followUpBonus;

      if (conv.estimated_value) {
        if (conv.estimated_value > 1000) score += 10;
        else if (conv.estimated_value > 500) score += 5;
      }

      score = Math.min(100, score);

      if (score >= 80) ranges['Critical (80+)']++;
      else if (score >= 60) ranges['High (60-79)']++;
      else if (score >= 40) ranges['Medium (40-59)']++;
      else ranges['Low (<40)']++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  }, [conversations]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm">Lead Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {scoreDistribution.every(d => d.value === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">No leads to score yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(217 91% 60%)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}