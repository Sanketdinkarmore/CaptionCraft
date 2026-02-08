import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeStrip from "@/components/MarqueeStrip";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import SectionDivider from "@/components/SectionDivider";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MarqueeStrip />
      <HowItWorks />
      <FeaturesSection />
      <SectionDivider variant="gradient" />
      <CTABanner />
      <Footer />
    </div>
  );
}
