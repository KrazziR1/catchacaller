import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Send, Search, Inbox, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import ConversationDetail from '@/components/conversations/ConversationDetail';
import ConversationFilters from '@/components/conversations/ConversationFilters';
import ConversationBulkActions from '@/components/conversations/ConversationBulkActions';
import SMSInbox from '@/components/conversations/SMSInbox';
import SendTemplatedSMSDialog from '@/components/conversations/SendTemplatedSMSDialog';
import PipelineAnalytics from '@/components/dashboard/PipelineAnalytics';
import LeadScoring from '@/components/dashboard/LeadScoring';
import AutomationRuleManager from '@/components/conversations/AutomationRuleManager';
import { Download } from 'lucide-react';

export default function Conversations() {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('conversations'); // conversations, inbox, analytics
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ stage: '', teamMember: '', urgency: '', dateRange: { from: '' } });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => base44.entities.BusinessProfile.list('-created_date', 1),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: () => base44.entities.Subscription.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', profiles[0]?.id],
    queryFn: () => base44.entities.TeamMember.filter({ account_id: profiles[0]?.id }),
    enabled: !!profiles[0]?.id,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at', 100),
  });

  const filtered = conversations.filter(c => {
    const matchesSearch = c.caller_phone?.includes(search) || c.caller_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStage = !filters.stage || c.pipeline_stage === filters.stage;
    const matchesTeam = !filters.teamMember || c.assigned_to === filters.teamMember;
    const matchesUrgency = !filters.urgency || c.urgency === filters.urgency;
    return matchesSearch && matchesStage && matchesTeam && matchesUrgency;
  });

  const selected = conversations.find(c => c.id === selectedId);
  const isGrowthPlus = subscriptions[0]?.plan_name && ['Growth', 'Pro'].includes(subscriptions[0].plan_name);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Conversations</h1>
          <p className="text-muted-foreground mt-1">Manage leads and their messages</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={view === 'conversations' ? 'default' : 'outline'}
            onClick={() => setView('conversations')}
            className="rounded-lg"
          >
            Conversations
          </Button>
          <Button
            variant={view === 'inbox' ? 'default' : 'outline'}
            onClick={() => setView('inbox')}
            className="rounded-lg"
          >
            <Inbox className="w-4 h-4 mr-2" />
            Inbox
          </Button>
          {isGrowthPlus && (
            <Button
              variant={view === 'analytics' ? 'default' : 'outline'}
              onClick={() => setView('analytics')}
              className="rounded-lg"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          )}
          <Button
            onClick={async () => {
              const res = await base44.functions.invoke('exportConversations', {});
              const blob = new Blob([res.data], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `conversations-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            variant="outline"
            className="rounded-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {view === 'inbox' && (
        <SMSInbox conversations={conversations} />
      )}

      {view === 'analytics' && isGrowthPlus && (
        <div className="space-y-6">
          <PipelineAnalytics user={user} subscription={subscriptions[0]} />
          <AutomationRuleManager profile={profiles[0]} />
        </div>
      )}

      {view === 'conversations' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <Card className="lg:col-span-1 rounded-2xl flex flex-col h-auto max-h-[700px]">
            <ConversationFilters
              search={search}
              onSearchChange={setSearch}
              selectedStage={filters.stage}
              onStageChange={(v) => setFilters({ ...filters, stage: v })}
              selectedTeamMember={filters.teamMember}
              onTeamMemberChange={(v) => setFilters({ ...filters, teamMember: v })}
              selectedUrgency={filters.urgency}
              onUrgencyChange={(v) => setFilters({ ...filters, urgency: v })}
              dateRange={filters.dateRange}
              onDateRangeChange={(v) => setFilters({ ...filters, dateRange: v })}
              teamMembers={teamMembers}
              onClear={() => setFilters({ stage: '', teamMember: '', urgency: '', dateRange: { from: '' } })}
            />
            <ConversationBulkActions
              selectedIds={selectedIds}
              onClear={() => setSelectedIds([])}
              profiles={profiles}
              teamMembers={teamMembers}
            />
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No conversations</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map(conv => (
                    <div
                      key={conv.id}
                      className={`flex items-start gap-3 p-3 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(conv.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, conv.id]);
                          else setSelectedIds(selectedIds.filter(id => id !== conv.id));
                        }}
                        className="mt-1"
                      />
                      <button
                        onClick={() => setSelectedId(conv.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="font-semibold text-xs truncate">{conv.caller_name || 'Unknown'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{conv.caller_phone}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <LeadScoring conversation={conv} />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Conversation Detail */}
          {selected ? (
            <div className="lg:col-span-2 space-y-4">
              <ConversationDetail
                conversation={selected}
                profile={profiles[0]}
                subscription={subscriptions[0]}
                user={user}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowSMSDialog(true)}
                  variant="outline"
                  className="flex-1 rounded-lg text-sm"
                >
                  <Send className="w-3 h-3 mr-2" />
                  Send Template SMS
                </Button>
              </div>
            </div>
          ) : (
            <Card className="lg:col-span-2 rounded-2xl flex items-center justify-center h-[600px]">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">Select a conversation to view messages</p>
              </div>
            </Card>
          )}
        </div>
      )}

      <SendTemplatedSMSDialog
        open={showSMSDialog}
        onOpenChange={setShowSMSDialog}
        singleConversation={selected}
        conversationIds={selectedIds}
      />
    </div>
  );
}