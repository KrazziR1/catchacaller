import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const { data: businessProfile } = useQuery({
    queryKey: ["user-business"],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.BusinessProfile.filter({ created_by: user.email });
      return profiles.length > 0 ? profiles[0] : null;
    },
    enabled: !!user && user.role !== "admin",
  });

  if (loading || !user) {
    return null;
  }

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate("/");
  };

  const isAdminPage = location.pathname === "/admin" || location.pathname === "/admin/compliance";
  const isDashboardPage = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard");
  const isLandingPage = location.pathname === "/";

  return (
    <div className="border-b border-border bg-card sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Navigation Tabs */}
        <div className="flex items-center gap-2">
          {/* Landing Link */}
          <Button
            variant={isLandingPage ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            CatchACaller
          </Button>

          {/* Dashboard Link (visible for all logged-in users with business) */}
          {businessProfile && (
            <Button
              variant={isDashboardPage ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          )}

          {/* Admin Panel Link (visible only for admins) */}
          {user.role === "admin" && (
            <Button
              variant={isAdminPage ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/admin")}
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
        </div>

        {/* Right: User Email + Logout */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}