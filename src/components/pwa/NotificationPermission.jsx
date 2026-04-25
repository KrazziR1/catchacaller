import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';

export default function NotificationPermission() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkNotificationPermission = () => {
      // Only show if notifications are supported and not already granted/denied
      if ('Notification' in window && Notification.permission === 'default' && !dismissed) {
        const hasShown = localStorage.getItem('notification-prompt-shown');
        if (!hasShown) {
          setShow(true);
        }
      }
    };

    setTimeout(checkNotificationPermission, 2000);
  }, [dismissed]);

  const handleEnable = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('notification-prompt-shown', 'true');
        new Notification('CatchACaller', {
          body: "You'll now receive alerts when leads engage with your business",
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%233b82f6" width="192" height="192" rx="45"/><text x="96" y="110" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">CA</text></svg>',
        });
      }
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-shown', 'true');
    setDismissed(true);
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-6 left-6 max-w-sm z-50">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-4">
        <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Enable Notifications?</p>
          <p className="text-xs text-muted-foreground mt-1">Get instant alerts when leads reply to your messages</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleEnable} className="h-8 px-3 rounded-lg">
            Enable
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}