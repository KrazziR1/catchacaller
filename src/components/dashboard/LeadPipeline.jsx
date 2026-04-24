import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

const stages = [
  { key: 'new', label: 'New', color: 'bg-slate-100' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-100' },
  { key: 'qualified', label: 'Qualified', color: 'bg-purple-100' },
  { key: 'booked', label: 'Booked', color: 'bg-green-100' },
  { key: 'won', label: 'Won', color: 'bg-accent/20' },
  { key: 'lost', label: 'Lost', color: 'bg-red-100' },
];

export default function LeadPipeline({ user, subscription }) {
  const [stageCounts, setStageCounts] = useState({});

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 100),
    enabled: isPlanAllowed,
  });

  useEffect(() => {
    const counts = {};
    stages.forEach(s => counts[s.key] = 0);
    conversations.forEach(c => {
      const stage = c.pipeline_stage || 'new';
      counts[stage] = (counts[stage] || 0) + 1;
    });
    setStageCounts(counts);
  }, [conversations]);

  const isPlanAllowed = subscription?.plan_name && ['Growth', 'Pro'].includes(subscription.plan_name);

  if (!isPlanAllowed) {
    return (
      <Card className="rounded-2xl p-6 border-amber-200 bg-amber-50">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-amber-900">CRM Pipeline (Growth+ feature)</p>
            <p className="text-xs text-amber-800 mt-1">Upgrade to Growth or Pro plan to access lead pipeline tracking.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="font-bold text-lg">Lead Pipeline</h3>
        <p className="text-xs text-muted-foreground mt-1">Track leads through your sales funnel</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stages.map(stage => (
          <div key={stage.key} className={`rounded-xl p-4 text-center ${stage.color}`}>
            <p className="text-xs font-semibold text-muted-foreground">{stage.label}</p>
            <p className="text-2xl font-bold mt-1">{stageCounts[stage.key] || 0}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}