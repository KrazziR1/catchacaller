import { MessageCircle, BarChart2, Cloud, Zap, CreditCard, Calendar } from 'lucide-react';

export const integrationLogos = [
  {
    name: 'Twilio',
    icon: MessageCircle,
    color: 'from-red-500 to-red-600',
    tier: 'all',
  },
  {
    name: 'HubSpot',
    icon: BarChart2,
    color: 'from-orange-500 to-orange-600',
    tier: 'growth',
  },
  {
    name: 'Salesforce',
    icon: Cloud,
    color: 'from-blue-500 to-blue-600',
    tier: 'growth',
  },
  {
    name: 'Zapier',
    icon: Zap,
    color: 'from-yellow-500 to-yellow-600',
    tier: 'growth',
  },
  {
    name: 'Stripe',
    icon: CreditCard,
    color: 'from-purple-500 to-purple-600',
    tier: 'growth',
  },
  {
    name: 'Google Calendar',
    icon: Calendar,
    color: 'from-green-500 to-green-600',
    tier: 'pro',
  },
];