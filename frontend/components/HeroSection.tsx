"use client";

import { Button } from "@/components/ui/button";
import FloatingBadge from "./FloatingBadge";
import heroImage from "@/assets/hero-video-editing.png";
import { Play, Sparkles, Zap } from "lucide-react";
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
    <section className="pt-28 pb-20 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto max-w-6xl relative">
        {/* Floating badges - decorative, hidden from a11y to avoid "contains emphasized elements" on font-semibold/bold */}
        <div className="absolute top-0 right-0 hidden lg:block z-10" aria-hidden="true">
          <FloatingBadge rotate={8} className="bg-card border-2 border-primary/20 shadow-xl" decorative>
            <Sparkles className="w-4 h-4 mr-1 text-primary" />
            <span className="text-xs font-semibold">AI POWERED</span>
          </FloatingBadge>
          <div className="mt-3 ml-8 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium shadow-xl animate-float" style={{ animationDelay: '0.5s' }}>
            Making Videos
            <br />
            <span className="font-bold text-base">Fun Again! ✨</span>
          </div>
        </div>
        
        <div className="absolute top-32 left-0 hidden lg:block">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-primary/30 animate-spin" style={{ animationDuration: '25s' }}>
            <div className="absolute inset-2 bg-accent rounded-full flex items-center justify-center text-3xl shadow-lg">
              🎬
            </div>
          </div>
        </div>

        {/* Left floating element */}
        <div className="absolute bottom-40 left-8 hidden xl:flex flex-col gap-3">
          <div className="bg-card border border-border rounded-2xl p-3 shadow-lg animate-float" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-foreground">Fast Export</p>
                <p className="text-muted-foreground">In seconds!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main headline */}
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/50 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Smart Hinglish Subtitles</span>
          </div>
          
          <h1 className="hero-text text-foreground mb-6 leading-[0.95]">
            <span className="block">CAPTIONS</span>
            <span className="block text-primary relative">
              ON DEMAND
              <svg className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-3" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 2 150 2 198 10" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            We take your subtitle stress away, so you can focus on the 
            <span className="text-foreground font-medium"> bigger picture.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="rounded-full uppercase tracking-wider group" onClick={handleStartCreating}>
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Start Creating
            </Button>
            <Button variant="heroOutline" size="xl" className="rounded-full">
              See How It Works
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex -space-x-2">
              {['😊', '🎉', '💜', '⭐', '🚀'].map((emoji, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-card border-2 border-background flex items-center justify-center text-lg shadow-sm">
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Trusted by <span className="text-foreground font-semibold">10,000+</span> creators worldwide
            </p>
          </div>
        </div>
        
        {/* Hero image - Enhanced */}
        <div className="mt-8 flex justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-[2rem] blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src={heroImageSrc}
              alt="Video editing workspace with colorful subtitles"
              className="relative max-w-full md:max-w-3xl rounded-3xl shadow-2xl animate-fade-in-up border border-border/50"
            />
            
            {/* Floating UI elements on image */}
            <div className="absolute -right-4 top-1/4 hidden md:block">
              <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-xl animate-float" style={{ animationDelay: '0.8s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-foreground">Auto-syncing...</span>
                </div>
              </div>
            </div>
            
            <div className="absolute -left-4 bottom-1/3 hidden md:block">
              <div className="bg-primary text-primary-foreground rounded-xl px-4 py-2 shadow-xl animate-float" style={{ animationDelay: '1.2s' }}>
                <p className="text-xs font-bold">+500 Subtitles</p>
                <p className="text-xs opacity-80">Generated today!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
