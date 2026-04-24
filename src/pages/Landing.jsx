import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import DemoSection from "@/components/landing/DemoSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import Pricing from "@/components/landing/Pricing";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import WaitlistSection from "@/components/landing/WaitlistSection";
import Footer from "@/components/landing/Footer";

export default function Landing() {
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
      <DemoSection />
      <IntegrationsSection />
      <div id="pricing">
        <Pricing />
      </div>
      <FAQSection />
      <ContactSection />
      <WaitlistSection />
      <Footer />
    </div>
  );
}