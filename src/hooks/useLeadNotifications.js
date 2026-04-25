import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export default function useLeadNotifications() {
  const lastCountRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const checkForNewLeads = async () => {
      try {
        const conversations = await Promise.race([
          base44.entities.Conversation.list('-last_message_at', 100),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
        const newConversations = conversations.filter(c => c.status === 'active');

        if (newConversations.length > lastCountRef.current && lastCountRef.current > 0) {
          const newCount = newConversations.length - lastCountRef.current;
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('CatchACaller', {
              body: `${newCount} new ${newCount === 1 ? 'lead' : 'leads'} arrived`,
              icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%233b82f6" width="192" height="192" rx="45"/><text x="96" y="110" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">CA</text></svg>',
              tag: 'lead-notification',
              requireInteraction: false,
            });
          }
        }

        lastCountRef.current = newConversations.length;
      } catch (error) {
        console.warn('Lead notification check skipped:', error?.message);
      }
    };

    // Only enable polling if notifications are available
    if ('Notification' in window) {
      // Don't block on initial load, start polling after delay
      intervalRef.current = setInterval(checkForNewLeads, 10000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}