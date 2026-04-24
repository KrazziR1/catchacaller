import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Settings, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const platforms = [
  { id: 'zapier', name: 'Zapier', description: 'Connect to 7000+ apps' },
  { id: 'hubspot', name: 'HubSpot', description: 'Popular CRM for service businesses' },
  { id: 'salesforce', name: 'Salesforce', description: 'Enterprise CRM' },
];

export default function CRMSettings({ profile, subscription }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('zapier');
  const [apiKey, setApiKey] = useState('');
  const queryClient = useQueryClient();

  const isGrowthPlus = subscription?.plan_name && ['Growth', 'Pro'].includes(subscription.plan_name);

  const { data: integrations = [] } = useQuery({
    queryKey: ['crm-integrations', profile?.id],
    queryFn: () => base44.entities.CRMIntegration.filter({ account_id: profile?.id }),
    enabled: !!profile?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CRMIntegration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-integrations'] });
      setShowDialog(false);
      setApiKey('');
      toast.success('Integration added');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => base44.entities.CRMIntegration.update(id, { is_enabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-integrations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CRMIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-integrations'] });
      toast.success('Integration removed');
    },
  });

  const handleAddIntegration = () => {
    createMutation.mutate({
      account_id: profile.id,
      platform: selectedPlatform,
      api_key: apiKey,
      is_enabled: true,
    });
  };

  if (!isGrowthPlus) {
    return (
      <Card className="rounded-2xl p-6 border-purple-200 bg-purple-50">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-purple-900">CRM Integrations (Growth+ feature)</p>
            <p className="text-xs text-purple-800 mt-1">Upgrade to Growth or Pro plan to sync leads to HubSpot, Salesforce, or Zapier.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">CRM Integrations</h3>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="rounded-lg">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Integration
        </Button>
      </div>

      {integrations.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">No integrations connected yet</p>
      ) : (
        <div className="space-y-3 mb-6">
          {integrations.map(int => (
            <div key={int.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">{int.platform.charAt(0).toUpperCase() + int.platform.slice(1)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={int.is_enabled ? 'default' : 'outline'} className="text-xs">
                    {int.is_enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={int.is_enabled}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: int.id, enabled: v })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-destructive"
                  onClick={() => deleteMutation.mutate(int.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add CRM Integration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Platform</Label>
              <div className="space-y-2 mt-2">
                {platforms.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedPlatform === p.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>API Key / Webhook URL</Label>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key or webhook URL"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPlatform === 'zapier' && 'Get your Zapier webhook URL from your Zap'}
                {selectedPlatform === 'hubspot' && 'Go to HubSpot Settings → Data Management → API Keys'}
                {selectedPlatform === 'salesforce' && 'Get from Setup → Security Controls → API'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAddIntegration}
              disabled={!apiKey || createMutation.isPending}
            >
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}