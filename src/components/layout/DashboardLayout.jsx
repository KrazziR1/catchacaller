import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        setChecked(true);
      }
    }).catch(() => setChecked(true));
  }, [navigate]);

  if (!checked) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}