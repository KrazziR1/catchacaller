import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function ColdCallSMSDialog({ prospect, open, onOpenChange }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: smsLogs = [] } = useQuery({
    queryKey: ["cold-call-sms", prospect?.id],
    queryFn: () =>
      base44.entities.ColdCallSMSLog.filter({ prospect_id: prospect?.id }).then((logs) =>
        logs.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
      ),
    enabled: !!prospect?.id,
  });

  const sendSMSMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke("sendColdCallSMS", {
        prospect_id: prospect.id,
        phone_number: prospect.phone_number,
        message_body: message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-call-sms", prospect.id] });
      setMessage("");
      toast.success("SMS sent successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send SMS");
    },
  });

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    setIsSending(true);
    try {
      await sendSMSMutation.mutateAsync();
    } finally {
      setIsSending(false);
    }
  };

  const statusColors = {
    sent: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    received: "bg-purple-100 text-purple-800",
  };

  const directionLabel = {
    outbound: "📤 Sent",
    inbound: "📥 Received",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>SMS: {prospect?.business_name}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{prospect?.phone_number}</p>
        </DialogHeader>

        <Tabs defaultValue="send" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Send Message</TabsTrigger>
            <TabsTrigger value="log">Message Log ({smsLogs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="flex-1 flex flex-col">
            <div className="space-y-4 py-4">
              <div>
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="mt-1.5 min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length} characters
                </p>
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="w-full rounded-xl h-11"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="log" className="flex-1 overflow-y-auto">
            <div className="space-y-3 py-4">
              {smsLogs.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No messages yet
                </p>
              ) : (
                smsLogs.map((log) => (
                  <Card key={log.id} className="rounded-lg">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {directionLabel[log.direction]}
                          </span>
                          <Badge className={statusColors[log.status]}>
                            {log.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.sent_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {log.message_body}
                      </p>
                      {log.sent_by && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Sent by: {log.sent_by}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}