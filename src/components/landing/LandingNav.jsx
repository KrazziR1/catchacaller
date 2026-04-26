import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PhoneCall, Menu, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">CatchACaller</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm">
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            user.role === 'admin' ? (
              <Link to="/admin">
                <Button size="sm" className="rounded-lg font-semibold">Admin Panel</Button>
              </Link>
            ) : (
              <Link to="/dashboard">
                <Button size="sm" className="rounded-lg font-semibold">Dashboard</Button>
              </Link>
            )
          ) : (
            <>
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => base44.auth.redirectToLogin("/dashboard")}>Log In</Button>
              <Link to="/onboarding">
                <Button size="sm" className="rounded-lg font-semibold">Start Free Trial</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-b border-border p-6 space-y-4">
          <a href="#features" className="block text-sm" onClick={() => setOpen(false)}>Features</a>
          <a href="#pricing" className="block text-sm" onClick={() => setOpen(false)}>Pricing</a>
          <a href="#how-it-works" className="block text-sm" onClick={() => setOpen(false)}>How It Works</a>
          {user ? (
            user.role === 'admin' ? (
              <Link to="/admin" onClick={() => setOpen(false)}>
                <Button className="w-full mt-2">Admin Panel</Button>
              </Link>
            ) : (
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                <Button className="w-full mt-2">Dashboard</Button>
              </Link>
            )
          ) : (
            <Link to="/onboarding" onClick={() => setOpen(false)}>
              <Button className="w-full mt-2">Start Free Trial</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}