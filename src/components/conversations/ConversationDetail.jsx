import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Send, Copy, Calendar, Zap, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PipelineStageSelector from './PipelineStageSelector';
import AssignmentSelector from './AssignmentSelector';
import ConversationNotes from './ConversationNotes';
import ConversationMessageStatus from './ConversationMessageStatus';
import CreateBookingDialog from './CreateBookingDialog';
import SMSSegmentCounter from './SMSSegmentCounter';

export default function ConversationDetail({ conversation, profile, subscription, user }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  // Real-time subscription to conversation updates
  useEffect(() => {
    const unsubscribe = base44.entities.Conversation.subscribe((event) => {
      if (event.id === conversation.id && event.type === 'update') {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });
    return unsubscribe;
  }, [conversation.id, queryClient]);

  const syncMutation = useMutation({
    mutationFn: () => base44.functions.invoke('manualSyncToCRM', { conversation_id: conversation.id }),
    onSuccess: () => {
      toast.success('Synced to CRM');
    },
    onError: (error) => {
      toast.error('Sync failed: ' + error.message);
    },
  });

  const autoFollowupMutation = useMutation({
    mutationFn: () => base44.functions.invoke('autoFollowUp', { conversation_id: conversation.id }),
    onSuccess: () => {
      toast.success('Follow-up scheduled');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.update(conversation.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation updated');
    },
  });

  const handleAddMessage = async () => {
    if (!reply.trim()) return;
    const messages = conversation.messages || [];
    messages.push({ sender: 'human', content: reply, timestamp: new Date().toISOString() });
    updateMutation.mutate({ messages, last_message_at: new Date().toISOString() });
    setReply('');
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(conversation.caller_phone);
    toast.success('Phone copied');
  };

  const statusConfig = {
    active: { label: 'Active', className: 'bg-primary/10 text-primary' },
    booked: { label: 'Booked', className: 'bg-accent/10 text-accent' },
    qualified: { label: 'Qualified', className: 'bg-blue-500/10 text-blue-600' },
    unresponsive: { label: 'Unresponsive', className: 'bg-muted text-muted-foreground' },
    lost: { label: 'Lost', className: 'bg-destructive/10 text-destructive' },
  };

  const statusCfg = statusConfig[conversation.status] || statusConfig.active;

  const isGrowthPlus = subscription?.plan_name && ['Growth', 'Pro'].includes(subscription.plan_name);
  const isPro = subscription?.plan_name === 'Pro';

  return (
    <>
      <Card className="lg:col-span-2 rounded-2xl flex flex-col h-auto">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-lg">{conversation.caller_name || 'Unknown'}</h2>
              <button
                onClick={handleCopyPhone}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mt-1"
              >
                <Phone className="w-3 h-3" />
                {conversation.caller_phone}
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <Badge className={statusCfg.className}>{statusCfg.label}</Badge>
          </div>
          {conversation.service_type && (
            <p className="text-xs text-muted-foreground mb-3">
              Service: <span className="font-medium">{conversation.service_type}</span>
            </p>
          )}
          {isGrowthPlus && (
            <div className="space-y-2">
              <div className="text-xs font-medium mb-2">Pipeline Stage</div>
              <PipelineStageSelector conversation={conversation} />
              <div className="mt-2">
                <AssignmentSelector conversation={conversation} profile={profile} onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })} />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="w-full mt-2 rounded-lg text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                {syncMutation.isPending ? 'Syncing...' : 'Sync to CRM'}
              </Button>
            </div>
          )}
        </div>

      {/* Messages */}
      <div className="overflow-y-auto p-4 space-y-4 max-h-[300px]">
        {(!conversation.messages || conversation.messages.length === 0) ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet
          </div>
        ) : (
          conversation.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'human' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === 'human'
                    ? 'bg-primary text-primary-foreground'
                    : msg.sender === 'ai'
                    ? 'bg-muted text-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'human' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {format(new Date(msg.timestamp), 'h:mm a')}
                </p>
                {msg.sender === 'human' && <ConversationMessageStatus smsStatus={msg.sms_status} />}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border space-y-3">
       <div className="flex gap-2">
         <div className="flex-1">
           <textarea
             value={reply}
             onChange={(e) => setReply(e.target.value)}
             placeholder="Type a message (Shift+Enter for new line)..."
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleAddMessage();
               }
             }}
             className="w-full rounded-xl text-sm p-2 border border-input bg-transparent resize-none"
             rows={2}
           />
         </div>
         <Button onClick={handleAddMessage} disabled={!reply.trim()} size="icon" className="rounded-xl h-10">
           <Send className="w-4 h-4" />
         </Button>
       </div>
       {reply && <SMSSegmentCounter message={reply} />}
       <div className="flex gap-2">
         {isPro && (
           <Button
             onClick={() => setShowBookingDialog(true)}
             variant="outline"
             size="sm"
             className="flex-1 rounded-lg text-xs"
           >
             <Calendar className="w-3 h-3 mr-1" />
             Create Booking
           </Button>
         )}
         {isGrowthPlus && (
           <Button
             onClick={() => autoFollowupMutation.mutate()}
             disabled={autoFollowupMutation.isPending}
             variant="outline"
             size="sm"
             className="flex-1 rounded-lg text-xs"
           >
             <Clock className="w-3 h-3 mr-1" />
             {autoFollowupMutation.isPending ? 'Sending...' : 'Send Follow-up'}
           </Button>
         )}
         <Button
           onClick={() => updateMutation.mutate({ status: 'lost' })}
           disabled={conversation.status === 'lost'}
           variant="outline"
           size="sm"
           className="flex-1 rounded-lg text-xs"
         >
           Mark Lost
         </Button>
       </div>
      </div>

      {/* Notes Section - Growth+ */}
      {isGrowthPlus && user && (
       <div className="p-4 border-t border-border">
         <ConversationNotes conversation={conversation} user={user} />
       </div>
      )}
      </Card>

      {/* Booking Dialog */}
      <CreateBookingDialog
      conversation={conversation}
      open={showBookingDialog}
      onOpenChange={setShowBookingDialog}
      />
      </>
      );
      }