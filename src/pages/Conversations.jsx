import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Bot, User, ArrowRight, CalendarCheck } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  active: { label: "Active", className: "bg-primary/10 text-primary border-primary/20" },
  booked: { label: "Booked", className: "bg-accent/10 text-accent border-accent/20" },
  qualified: { label: "Qualified", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  unresponsive: { label: "No Reply", className: "bg-muted text-muted-foreground border-border" },
  lost: { label: "Lost", className: "bg-destructive/10 text-destructive border-destructive/20" },
  manual_takeover: { label: "Manual", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
};

export default function Conversations() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => base44.entities.Conversation.list("-last_message_at", 100),
  });

  const filtered = conversations.filter(c =>
    !search ||
    c.caller_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.caller_phone?.includes(search)
  );

  const selected = conversations.find(c => c.id === selectedId);

  return (
    <div className="flex h-full">
      {/* Sidebar list */}
      <div className="w-full md:w-96 border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold mb-3">Conversations</h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const status = statusConfig[conv.status] || statusConfig.active;
              const lastMsg = conv.messages?.length ? conv.messages[conv.messages.length - 1] : null;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left p-4 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                    selectedId === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{conv.caller_name || conv.caller_phone}</p>
                      {lastMsg && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg.content}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`${status.className} border text-[10px] shrink-0`}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-muted-foreground font-mono">{conv.caller_phone}</p>
                    {conv.last_message_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(conv.last_message_at), "MMM d, h:mm a")}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message view */}
      <div className="hidden md:flex flex-1 flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold">{selected.caller_name || selected.caller_phone}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">{selected.caller_phone}</span>
                  {selected.service_type && (
                    <span className="text-xs text-muted-foreground">• {selected.service_type}</span>
                  )}
                  {selected.urgency && (
                    <Badge variant="outline" className="text-[10px]">{selected.urgency}</Badge>
                  )}
                </div>
              </div>
              {selected.status !== "booked" && (
                <Button size="sm" variant="outline" className="rounded-lg text-xs">
                  <CalendarCheck className="w-3 h-3 mr-1.5" />
                  Send Booking Link
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {(!selected.messages || selected.messages.length === 0) ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                selected.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.sender === "lead" ? "justify-end" : ""}`}>
                    {msg.sender !== "lead" && (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.sender === "ai" ? "bg-primary/10" : "bg-accent/10"
                      }`}>
                        {msg.sender === "ai" ? (
                          <Bot className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-accent" />
                        )}
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === "lead"
                        ? "bg-primary text-primary-foreground"
                        : msg.sender === "ai"
                        ? "bg-muted"
                        : "bg-accent/10 border border-accent/20"
                    }`}>
                      {msg.content}
                      {msg.timestamp && (
                        <p className={`text-[10px] mt-1 ${
                          msg.sender === "lead" ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}>
                          {format(new Date(msg.timestamp), "h:mm a")}
                        </p>
                      )}
                    </div>
                    {msg.sender === "lead" && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input placeholder="Type a manual reply..." className="rounded-xl" />
                <Button className="rounded-xl">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/10 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}