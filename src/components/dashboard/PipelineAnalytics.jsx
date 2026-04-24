import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const stages = ['new', 'contacted', 'qualified', 'booked', 'won', 'lost'];
const stageLabels = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', won: 'Won', lost: 'Lost' };

export default function PipelineAnalytics({ user, subscription }) {
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 500),
  });

  const isGrowthPlus = subscription?.plan_name && ['Growth', 'Pro'].includes(subscription.plan_name);

  if (!isGrowthPlus) {
    return (
      <Card className="rounded-2xl p-6 border-blue-200 bg-blue-50">
        <div className="flex gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-blue-900">Pipeline Analytics (Growth+ feature)</p>
            <p className="text-xs text-blue-800 mt-1">Upgrade to Growth or Pro to view detailed conversion analytics.</p>
          </div>
        </div>
      </Card>
    );
  }

  // Calculate stage distribution
  const stageCounts = stages.map(stage => ({
    stage,
    count: conversations.filter(c => c.pipeline_stage === stage).length,
  }));

  // Calculate conversions
  const totalLeads = conversations.length;
  const booked = stageCounts.find(s => s.stage === 'booked').count;
  const won = stageCounts.find(s => s.stage === 'won').count;
  const conversionRate = totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0;
  const winRate = booked > 0 ? Math.round((won / booked) * 100) : 0;

  // Avg time per stage
  const avgTimePerStage = stages.map(stage => {
    const leadsInStage = conversations.filter(c => c.pipeline_stage === stage);
    if (leadsInStage.length === 0) return { stage, avgDays: 0 };
    const avgMs = leadsInStage.reduce((sum, c) => sum + (new Date(c.updated_date) - new Date(c.created_date)), 0) / leadsInStage.length;
    const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
    return { stage, avgDays };
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Funnel */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stageCounts.map((s, i) => {
              const width = totalLeads > 0 ? Math.round((s.count / totalLeads) * 100) : 0;
              return (
                <div key={s.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{stageLabels[s.stage]}</span>
                    <span className="text-xs text-muted-foreground">{s.count} ({width}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Conversion Rate</span>
            <Badge className="bg-primary/10 text-primary">{conversionRate}%</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Win Rate</span>
            <Badge className="bg-accent/10 text-accent">{winRate}%</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Total Leads</span>
            <Badge variant="outline">{totalLeads}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Booked</span>
            <Badge variant="outline">{booked}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}