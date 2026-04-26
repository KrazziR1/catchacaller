import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';


import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import MissedCalls from '@/pages/MissedCalls';

import Conversations from '@/pages/Conversations';
import Templates from '@/pages/Templates';
import Settings from '@/pages/Settings';
import WebhookMonitor from '@/pages/WebhookMonitor';
import Admin from '@/pages/Admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Onboarding from '@/pages/Onboarding';
import Blog from '@/pages/Blog';
import WaitlistAdmin from '@/pages/WaitlistAdmin';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Terms from '@/pages/Terms';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import SMSPolicy from '@/pages/SMSPolicy';
import Unsubscribe from '@/pages/Unsubscribe';
import DPA from '@/pages/DPA';
import AdvancedReporting from '@/pages/AdvancedReporting';
import CalendarIntegration from '@/pages/CalendarIntegration';
import ComplianceAudit from '@/pages/ComplianceAudit';
import ComplianceDashboard from '@/pages/ComplianceDashboard';
import SalesResources from '@/pages/SalesResources';
import ComingSoon from '@/pages/ComingSoon';


function App() {
  // No loading gate needed — the raw content dump is caused by the Base44 platform
  // injecting its schema route before React mounts. The fix is handled at the
  // platform level via the router. Rendering immediately prevents any blank/white flash.

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/compliance" element={<ComplianceDashboard />} />
          <Route path="/sales-resources" element={<SalesResources />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/missed-calls" element={<MissedCalls />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/webhooks" element={<WebhookMonitor />} />
            <Route path="/waitlist" element={<WaitlistAdmin />} />
            <Route path="/reporting" element={<AdvancedReporting />} />
            <Route path="/calendar" element={<CalendarIntegration />} />
            <Route path="/compliance" element={<ComplianceAudit />} />
          </Route>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/sms-policy" element={<SMSPolicy />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/dpa" element={<DPA />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Blog />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App