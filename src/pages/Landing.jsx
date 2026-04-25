import TopNav from "@/components/layout/TopNav";
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
    base44.auth.isAuthenticated().then((authed) => {
      if (!authed) return; // Show landing for non-authenticated users
      base44.auth.me().then((user) => {
        if (user?.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (user) {
          // Check if user has a business profile
          base44.entities.BusinessProfile.filter({ created_by: user.email }).then((profiles) => {
            if (profiles.length > 0) {
              navigate("/dashboard", { replace: true });
            } else {
              navigate("/onboarding", { replace: true });
            }
          }).catch(() => navigate("/onboarding", { replace: true }));
        }
      }).catch(() => {});
    }).catch(() => {});
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <TopNav />
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