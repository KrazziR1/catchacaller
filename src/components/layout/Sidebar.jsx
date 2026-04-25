import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, PhoneMissed, MessageSquare, 
  FileText, Settings, PhoneCall, LogOut, ChevronLeft, ChevronRight, Users, Activity, BarChart3, Calendar, Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: PhoneMissed, label: "Missed Calls", path: "/missed-calls" },
  { icon: MessageSquare, label: "Conversations", path: "/conversations" },
  { icon: FileText, label: "Templates", path: "/templates" },
  { icon: BarChart3, label: "Reporting", path: "/reporting" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const adminNavItems = [
  { icon: Shield, label: "Compliance", path: "/compliance" },
  { icon: Activity, label: "Webhooks", path: "/webhooks" },
  { icon: Users, label: "Waitlist", path: "/waitlist" },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    Promise.race([
      base44.auth.me(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
    ])
      .then((u) => {
        if (u?.role === 'admin') setIsAdmin(true);
      })
      .catch((e) => {
        console.warn('Admin check timeout:', e.message);
      });
  }, []);

  return (
    <aside className={`${collapsed ? "w-[72px]" : "w-64"} h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold text-sidebar-foreground tracking-tight">CatchACaller</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {[...navItems, ...(isAdmin ? adminNavItems : [])].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-all"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}