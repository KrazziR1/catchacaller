import { PhoneCall } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <PhoneCall className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">CatchACaller</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered missed call recovery for service businesses. Turn every missed call into booked revenue. — catchacaller.com
            </p>
          </div>
          <div className="flex gap-16 text-sm">
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="/sms-policy" className="hover:text-foreground transition-colors">SMS Policy</a></li>
                <li><a href="/dpa" className="hover:text-foreground transition-colors">Data Processing Agreement</a></li>
                <li><a href="/unsubscribe" className="hover:text-foreground transition-colors">Email Unsubscribe</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground text-center space-y-2">
          <p>© 2026 CatchACaller. All rights reserved.</p>
          <p className="text-xs">
            CatchACaller is a technology platform. SMS messages are sent on behalf of our business customers who are solely responsible for compliance with applicable laws including TCPA.{" "}
            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a> ·{" "}
            <a href="/terms" className="underline hover:text-foreground">Terms</a> ·{" "}
            <a href="/sms-policy" className="underline hover:text-foreground">SMS Policy</a>
          </p>
        </div>
      </div>
    </footer>
  );
}