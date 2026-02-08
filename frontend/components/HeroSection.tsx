"use client";

import { Button } from "@/components/ui/button";
import FloatingBadge from "./FloatingBadge";
import heroImage from "@/assets/hero-video-editing.png";
import { Play, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authClient";

const HeroSection = () => {
  const router = useRouter();

  const handleStartCreating = () => {
    const token = getToken();
    if (token) {
      router.push("/editor");
    } else {
      router.push("/login");
    }
  };

  const heroImageSrc = typeof heroImage === "string" ? heroImage : heroImage.src;

  return (
    <section className="pt-24 pb-8 md:pb-12 px-4 relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Dynamic gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-30 animate-morph" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-accent/25 rounded-full blur-3xl opacity-25 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-primary/15 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Top badge with animation */}
            <div className="inline-block animate-fade-in-up">
              <div className="flex items-center gap-2 bg-accent/40 border border-primary/30 rounded-full px-4 py-2 backdrop-blur-sm hover:bg-accent/60 transition-colors duration-300 cursor-pointer">
                <Sparkles className="w-4 h-4 text-primary hover:animate-spin transition-all" />
                <span className="text-sm font-medium text-foreground">AI-Powered Hinglish Captions</span>
                <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Main Headline - Bold and distinctive */}
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-foreground">
                <span className="block relative text-purple-500">
                  Subtitles
                  <span className="absolute -bottom-3 left-0 w-32 h-1 bg-gradient-to-r from-primary via-primary to-transparent rounded-full blur-sm opacity-60" />
                </span>
                <span className="block text-primary relative mt-4 ">
                  Made Simple
                  {/* Decorative line */}
                  <svg className="absolute -bottom-4 left-0 w-full h-8" viewBox="0 0 300 30" fill="none" preserveAspectRatio="none">
                    <path 
                      d="M2 15Q75 5 150 15T298 15" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="4" 
                      fill="none"
                      opacity="0.4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </span>
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Upload your video, get <span className="text-foreground font-semibold text-purple-700">intelligent Hinglish captions</span> in seconds. Customize, export, and ship.
            </p>

            {/* CTA Buttons - Bold and modern */}
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Button 
                variant="hero" 
                size="xl" 
                className="rounded-xl uppercase tracking-widest font-bold shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1" 
                onClick={handleStartCreating}
              >
                <Play className="w-5 h-5 mr-3 hover:scale-125 transition-transform" />
                Start Creating
              </Button>
              <Button 
                variant="heroOutline" 
                size="xl" 
                className="rounded-xl font-semibold uppercase tracking-wider transition-all hover:translate-x-1"
              >
                See Demo
                <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
              </Button>
            </div>

            {/* Social proof - Modernized */}
            <div className="pt-8 border-t border-border/50 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <p className="text-sm text-muted-foreground mb-3 font-medium">TRUSTED BY CREATORS</p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['😊', '🎉', '💜', '⭐', '🚀'].map((emoji, i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-card border-2 border-background flex items-center justify-center text-base shadow-md hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-foreground font-semibold">10,000+ creators worldwide</span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image with floating elements */}
          <div className="relative h-full min-h-[500px] lg:min-h-[600px] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Floating background elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-3xl blur-2xl rotate-45 animate-float" />
            <div className="absolute -bottom-32 left-1/2 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

            {/* Main image container - Asymmetrical positioning */}
            <div className="relative h-full flex items-center justify-end">
              {/* Image with border and shadow */}
              <div className="relative w-full max-w-md hover:scale-105 transition-transform duration-300">
                {/* Glow effect behind image */}
                <div className="absolute -inset-8 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 rounded-3xl blur-2xl opacity-0 hover:opacity-100 transition-opacity duration-500" />
                
                {/* Main image */}
                <div className="relative rounded-3xl overflow-hidden border-2 border-border/50 shadow-2xl">
                  <img
                    src={heroImageSrc}
                    alt="Video editing workspace with Hinglish subtitles"
                    className="w-full h-auto transition-transform duration-300 hover:scale-110"
                  />
                  
                  {/* Scan line effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/5 to-white/0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Floating stat card - Top right */}
                <div className="absolute -top-6 -right-8 bg-card/50 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md animate-float" style={{ animationDelay: '0.8s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-foreground tracking-wide">LIVE</p>
                      <p className="text-xs text-muted-foreground">Auto-syncing</p>
                    </div>
                  </div>
                </div>

                {/* Floating stat card - Bottom left */}
                <div className="absolute -bottom-4 -left-12 bg-primary text-primary-foreground rounded-2xl px-5 py-3 shadow-xl animate-float" style={{ animationDelay: '0.8s' }}>
                  <p className="text-sm font-black">+500</p>
                  <p className="text-xs opacity-90">Generated today</p>
                </div>

                {/* Speed badge - Right side */}
                <div className="absolute top-1/2 -right-16 bg-card/50 border border-white/10 rounded-full px-4 py-3 shadow-lg backdrop-blur-md animate-float" style={{ animationDelay: '0.8s' }}>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Fast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decoration - flows into marquee */}
        <div className="mt-12 pt-8 border-t border-border/30 flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trusted by top creators</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;