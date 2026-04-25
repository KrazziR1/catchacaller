import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function NotificationPreferences() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => base44.entities.BusinessProfile.list("-created_date", 1),
  });

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (profile && profile.length > 0) {
      setEmailNotificationsEnabled(profile[0].email_notifications_enabled ?? true);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const profileId = profile[0].id;
      return base44.entities.BusinessProfile.update(profileId, {
        email_notifications_enabled: emailNotificationsEnabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Control email notifications for missed calls and conversations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex-1">
            <p className="font-semibold text-sm">Email Notifications</p>
            <p className="text-xs text-muted-foreground mt-1">
              Receive email alerts when you get missed calls and new conversations
            </p>
          </div>
          <Switch
            checked={emailNotificationsEnabled}
            onCheckedChange={setEmailNotificationsEnabled}
            disabled={updateMutation.isPending}
          />
        </div>

        {emailNotificationsEnabled ? (
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-accent">Email notifications enabled</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll receive email notifications when new missed calls come in and when leads respond to SMS.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/50 border border-border flex gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Email notifications disabled</p>
              <p className="text-xs text-muted-foreground mt-1">
                You won't receive email alerts. You can still view all activity in your dashboard.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl h-10"
          >
            {updateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-accent" />Saved!</>
            ) : (
              <>Save Preferences</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}