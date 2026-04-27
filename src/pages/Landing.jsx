import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import DemoSection from "@/components/landing/DemoSection";
import DemoCTA from "@/components/landing/DemoCTA";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import Pricing from "@/components/landing/Pricing";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import GetStartedCTA from "@/components/landing/GetStartedCTA";
import Footer from "@/components/landing/Footer";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Base44 sets the session cookie after redirect from invite email.
    // We retry a few times with increasing delays to catch it.
    let attempts = 0;
    const maxAttempts = 5;

    const check = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (_) {}

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(check, attempts * 300); // 300ms, 600ms, 900ms, 1200ms
      }
    };

    check();
  }, []);

  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <Stats />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="features">
        <Features />
      </div>
      <div id="pricing">
        <Pricing />
      </div>
      <div id="integrations">
        <IntegrationsSection />
      </div>
      <div id="faq">
        <FAQSection />
      </div>
      <div id="contact">
        <ContactSection />
      </div>
      <GetStartedCTA />
      <Footer />
    </div>
  );
}
