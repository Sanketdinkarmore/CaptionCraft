"use client";

import { Button } from "@/components/ui/button";
import FloatingBadge from "./FloatingBadge";
import heroImage from "@/assets/hero-video-editing.png";
import { Play, Sparkles, Zap, ArrowRight, Zap as ZapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authClient";
import { useState } from "react";

const HeroSection = () => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

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
    <section className="pt-16 pb-12 md:pb-16 px-4 relative overflow-hidden min-h-screen flex items-center">
      {/* Organic background - subtle and dynamic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left organic blob */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-primary/15 to-transparent rounded-[45% 55% 60% 40% / 55% 45% 55% 45%] blur-3xl animate-blob opacity-40" />
        
        {/* Center-right organic shape */}
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-gradient-to-bl from-accent/20 to-transparent rounded-[30% 70% 70% 30% / 30% 30% 70% 70%] blur-3xl animate-blob opacity-30" style={{ animationDelay: '2s' }} />
        
        {/* Bottom organic element */}
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-gradient-to-tr from-primary/10 to-transparent rounded-[60% 40% 30% 70% / 60% 30% 70% 40%] blur-3xl animate-blob opacity-25" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge - Subtle and elegant */}
            <div className="inline-block animate-fade-in-up">
              <div className="flex items-center gap-2 bg-primary/8 border border-primary/25 rounded-full px-4 py-2.5 backdrop-blur-md hover:bg-primary/12 transition-all duration-500 cursor-pointer group">
                <Sparkles className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-500" />
                <span className="text-sm font-medium text-foreground">AI-Powered Hinglish Captions</span>
                <ArrowRight className="w-3.5 h-3.5 text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-500" />
              </div>
            </div>

            {/* Main Headline - Bold, expressive, responsive */}
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="relative">
                <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-foreground">
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground pb-2">
                    Captions
                  </span>
                  <span className="block text-foreground">that feel real</span>
                </h1>
                
                {/* Accent line - organic shape */}
                <div className="absolute -bottom-6 left-0 h-1.5 w-32 bg-gradient-to-r from-primary via-primary to-transparent rounded-full blur-sm opacity-70" />
              </div>
            </div>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Upload your video, get <span className="text-foreground font-semibold">intelligent Hinglish subtitles</span> in seconds. Customize, export, and ship faster.
            </p>

            {/* CTA Buttons - Modern stacked design */}
            <div className="flex flex-col sm:flex-row items-start gap-3 pt-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Button 
                variant="hero" 
                size="xl" 
                className="rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 group w-full sm:w-auto"
                onClick={handleStartCreating}
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform duration-500" />
                Start Creating
              </Button>
              <Button 
                variant="heroOutline" 
                size="xl" 
                className="rounded-xl font-semibold transition-all duration-500 hover:translate-x-1 group w-full sm:w-auto"
              >
                See Demo
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-500" />
              </Button>
            </div>

            {/* Social proof - Modern layout */}
            <div className="pt-8 border-t border-border/40 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <p className="text-xs text-muted-foreground mb-4 font-semibold tracking-widest uppercase">Trusted by creators</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex -space-x-3">
                  {['👩‍🎬', '🎥', '✨', '🎭', '🚀'].map((emoji, i) => (
                    <div 
                      key={i} 
                      className="w-11 h-11 rounded-full bg-card border-2 border-background flex items-center justify-center text-lg shadow-md hover:scale-125 hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-foreground font-semibold">10,000+ creators worldwide</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual showcase with dynamic elements */}
          <div className="relative h-auto min-h-[400px] md:min-h-[500px] lg:min-h-[600px] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Asymmetrical floating shapes - more organic */}
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-gradient-to-br from-primary/10 to-transparent rounded-[40% 60% 70% 30% / 40% 50% 60% 50%] blur-2xl animate-blob opacity-50" />
            <div className="absolute -bottom-32 left-0 w-96 h-96 bg-gradient-to-tr from-accent/8 to-transparent rounded-[50% 50% 40% 60% / 55% 45% 55% 45%] blur-3xl animate-blob opacity-35" style={{ animationDelay: '3s' }} />

            {/* Main showcase card - Tilted asymmetrical design */}
            <div className="relative h-full flex items-center justify-center lg:justify-end perspective">
              <div 
                className="relative w-full max-w-md transform transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Enhanced glow effect on hover */}
                <div className={`absolute -inset-6 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur-2xl opacity-0 transition-all duration-500 ${hoveredCard === 1 ? 'opacity-40' : 'opacity-0'}`} />
                
                {/* Main image card */}
                <div className="relative rounded-3xl overflow-hidden border-2 border-border/50 shadow-2xl backdrop-blur-sm">
                  <img
                    src={heroImageSrc}
                    alt="Video editing workspace with Hinglish subtitles"
                    className="w-full h-auto transition-transform duration-500 hover:scale-110"
                  />
                  
                  {/* Overlay gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>

                {/* Floating stat cards - Positioned asymmetrically */}
                {/* Top floating card */}
                <div 
                  className={`absolute -top-8 -right-6 bg-card/80 border border-border/50 rounded-2xl p-4 shadow-lg backdrop-blur-lg transform transition-all duration-500 animate-float ${hoveredCard === 1 ? 'scale-110 shadow-2xl' : ''}`}
                  style={{ animationDelay: '0s' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-2.5 h-2.5">
                      <div className="absolute inset-0 rounded-full bg-primary animate-pulse" />
                      <div className="absolute inset-0 rounded-full bg-primary/30 animate-blob" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground tracking-widest">LIVE</p>
                      <p className="text-xs text-muted-foreground">Auto-syncing</p>
                    </div>
                  </div>
                </div>

                {/* Bottom left stat card */}
                <div 
                  className={`absolute -bottom-6 -left-4 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-2xl px-6 py-4 shadow-lg transform transition-all duration-500 animate-float ${hoveredCard === 1 ? 'scale-110 shadow-2xl' : ''}`}
                  style={{ animationDelay: '1s' }}
                >
                  <p className="text-sm font-black">+500</p>
                  <p className="text-xs opacity-90 font-medium">Generated today</p>
                </div>

                {/* Right side badge */}
                <div 
                  className={`absolute top-1/2 -right-20 lg:-right-24 bg-card/80 border border-border/50 rounded-full px-4 py-3 shadow-lg backdrop-blur-lg transform transition-all duration-500 animate-float ${hoveredCard === 1 ? 'scale-110 shadow-2xl' : ''}`}
                  style={{ animationDelay: '0.5s' }}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <ZapIcon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Lightning Fast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom divider - Organic shape */}
        <div className="mt-16 pt-12 border-t border-border/40 flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-border to-border" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Loved by content creators</span>
          <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent via-border to-border" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
