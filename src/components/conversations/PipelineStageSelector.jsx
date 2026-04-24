import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const stages = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'booked', label: 'Booked' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

export default function PipelineStageSelector({ conversation }) {
  const queryClient = useQueryClient();
  
  const updateMutation = useMutation({
    mutationFn: (stage) => base44.entities.Conversation.update(conversation.id, { 
      pipeline_stage: stage,
      status: stage === 'booked' ? 'booked' : conversation.status
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Stage updated');
    },
  });

  const currentStageIndex = stages.findIndex(s => s.key === conversation.pipeline_stage);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {stages.map((stage, i) => (
        <div key={stage.key} className="flex items-center gap-2">
          <Button
            size="sm"
            variant={conversation.pipeline_stage === stage.key ? 'default' : 'outline'}
            onClick={() => updateMutation.mutate(stage.key)}
            disabled={updateMutation.isPending}
            className="rounded-lg text-xs"
          >
            {stage.label}
          </Button>
          {i < stages.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}