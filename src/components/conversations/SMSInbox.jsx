import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function SMSInbox({ conversations }) {
  const getUnreadCount = (conv) => {
    if (!conv.messages) return 0;
    // Count unread messages (assumes "lead" messages are unread until viewed)
    return conv.messages.filter(m => m.sender === 'lead').length;
  };

  const conversationsWithMessages = conversations
    .filter(c => c.messages && c.messages.length > 0)
    .sort((a, b) => {
      const aUnread = getUnreadCount(a);
      const bUnread = getUnreadCount(b);
      if (bUnread !== aUnread) return bUnread - aUnread;
      return new Date(b.last_message_at) - new Date(a.last_message_at);
    });

  return (
    <Card className="rounded-2xl h-[600px] flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {conversationsWithMessages.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          conversationsWithMessages.map(conv => {
            const unread = getUnreadCount(conv);
            const lastMsg = conv.messages[conv.messages.length - 1];
            return (
              <div key={conv.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                        {conv.caller_name || conv.caller_phone}
                      </p>
                      {unread > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {lastMsg.content}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {format(new Date(lastMsg.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}