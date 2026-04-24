import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, BookOpen, Send, Copy, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ConversationDetail({ conversation }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

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

  return (
    <Card className="lg:col-span-2 rounded-2xl flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
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
          <p className="text-xs text-muted-foreground mt-2">
            Service: <span className="font-medium">{conversation.service_type}</span>
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex gap-2">
          <Input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
            className="rounded-xl"
          />
          <Button onClick={handleAddMessage} disabled={!reply.trim()} size="icon" className="rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => updateMutation.mutate({ status: 'booked' })}
            disabled={conversation.status === 'booked'}
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg text-xs"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Mark Booked
          </Button>
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
    </Card>
  );
}