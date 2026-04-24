import { CheckCircle2, Clock, AlertCircle, Check } from 'lucide-react';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Sending...' },
  sent: { icon: Check, color: 'text-blue-500', label: 'Sent' },
  delivered: { icon: CheckCircle2, color: 'text-accent', label: 'Delivered' },
  failed: { icon: AlertCircle, color: 'text-destructive', label: 'Failed' },
};

export default function ConversationMessageStatus({ smsStatus }) {
  if (!smsStatus) return null;
  
  const config = statusConfig[smsStatus] || statusConfig.sent;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
      <Icon className={`w-3 h-3 ${config.color}`} />
      {config.label}
    </div>
  );
}