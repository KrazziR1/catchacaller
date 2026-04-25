import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Unlink, Calendar } from "lucide-react";

export default function CalendarIntegration() {
  const queryClient = useQueryClient();
  const [calendarType, setCalendarType] = useState("calendly");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const { data: profile = {} } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => base44.entities.BusinessProfile.list("-created_date", 1).then(p => p[0] || {}),
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["calendar-integrations"],
    queryFn: () => base44.entities.CRMIntegration.filter({ platform: "calendly" }).catch(() => []),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existing = integrations.find(i => i.platform === calendarType);
      const data = {
        account_id: profile.id,
        platform: calendarType,
        api_key: apiKey,
        is_enabled: true,
        sync_events: ["booking_created"],
      };

      if (existing) {
        return base44.entities.CRMIntegration.update(existing.id, data);
      }
      return base44.entities.CRMIntegration.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations"] });
      setApiKey("");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (integrationId) => base44.entities.CRMIntegration.delete(integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations"] });
    },
  });

  const existing = integrations.find(i => i.platform === calendarType);
  const isConnected = existing?.is_enabled;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Calendar Integration</h1>
        <p className="text-muted-foreground mt-1">Connect your booking calendar to auto-sync appointments</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Select Your Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Calendar Platform</Label>
            <Select value={calendarType} onValueChange={setCalendarType}>
              <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendly">Calendly</SelectItem>
                <SelectItem value="acuity">Acuity Scheduling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isConnected ? (
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-accent">Connected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your {calendarType === "calendly" ? "Calendly" : "Acuity"} is synced. New bookings will auto-create conversations.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnectMutation.mutate(existing.id)}
                disabled={disconnectMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Unlink className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label>
                  {calendarType === "calendly"
                    ? "Calendly API Token"
                    : "Acuity Scheduling API Key"}
                </Label>
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={calendarType === "calendly" ? "Paste your token" : "Paste your API key"}
                  type="password"
                  className="mt-1.5 h-12 rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {calendarType === "calendly" ? (
                    <>Find your token in Calendly Settings → Integrations → API tokens</>
                  ) : (
                    <>Find your key in Acuity Scheduling → Settings → Integrations → API</>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold">How it works</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>✓ When a lead books via your calendar link, we auto-create a conversation</li>
                    <li>✓ Booking status syncs in real-time</li>
                    <li>✓ No duplicate entries—one conversation per lead</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!apiKey || saveMutation.isPending}
                className="w-full h-11 rounded-xl"
              >
                {saveMutation.isPending ? "Connecting..." : "Connect Calendar"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl mt-6">
        <CardHeader>
          <CardTitle className="text-sm">What happens after connecting?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>✓ When a lead books via your calendar, we automatically create a Conversation record</p>
          <p>✓ The lead's email and selected time slot are captured</p>
          <p>✓ Status updates sync back to your calendar</p>
          <p>✓ You can still send follow-ups, templates, and notes—all tied to the booking</p>
        </CardContent>
      </Card>
    </div>
  );
}