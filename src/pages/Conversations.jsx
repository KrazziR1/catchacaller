import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Send, Search, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import ConversationDetail from '@/components/conversations/ConversationDetail';

export default function Conversations() {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);

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

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at', 100),
  });

  const filtered = conversations.filter(c =>
    c.caller_phone?.includes(search) || c.caller_name?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = conversations.find(c => c.id === selectedId);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground mt-1">Manage leads and their messages</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <Card className="lg:col-span-1 rounded-2xl flex flex-col h-[600px]">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left p-4 transition-colors hover:bg-muted/50 ${
                      selectedId === conv.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{conv.caller_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{conv.caller_phone}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {conv.messages?.[conv.messages.length - 1]?.content || 'No messages'}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                        conv.status === 'booked' ? 'bg-accent' : 'bg-primary/50'
                      }`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {conv.last_message_at ? format(new Date(conv.last_message_at), 'MMM d, h:mm a') : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Conversation Detail */}
        {selected ? (
          <ConversationDetail
            conversation={selected}
            profile={profiles[0]}
            subscription={subscriptions[0]}
            user={user}
          />
        ) : (
          <Card className="lg:col-span-2 rounded-2xl flex items-center justify-center h-[600px]">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}