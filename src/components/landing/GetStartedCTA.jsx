import { motion } from "framer-motion";
import { ArrowRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function GetStartedCTA() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    base44.auth.isAuthenticated().then((isAuthed) => {
      if (isAuthed) {
        navigate("/onboarding");
      } else {
        base44.auth.redirectToLogin("/onboarding");
      }
    });
  };

  return (
    <section className="py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
             <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
             <span className="text-sm font-medium text-primary">7-Day Trial — Just $2.99</span>
           </div>

          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Stop losing leads to<br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              missed calls
            </span>
          </h2>

          <p className="text-muted-foreground text-lg">
            Twilio activation takes 1-2 business days.
          </p>

          <Button
            size="lg"
            className="h-14 px-10 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            onClick={handleGetStarted}
          >
            Start Your 7-Day Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <p className="text-xs text-muted-foreground">
            $2.99 provisioning fee. Full access for 7 days. Month-to-month after.
          </p>
        </motion.div>
      </div>
    </section>
  );
}