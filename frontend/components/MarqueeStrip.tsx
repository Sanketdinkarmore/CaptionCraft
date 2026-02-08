"use client";

import { Zap } from "lucide-react";

const features = [
  "AI-Powered Hinglish",
  "Smart Sync",
  "Custom Fonts",
  "Fast Export",
  "SRT Support",
  "Burned-in Captions",
  "Instant Delivery",
  "Easy Editing",
  "Multi-Format",
  "HD Ready",
];

const MarqueeStrip = () => {
  return (
    <div className="w-full overflow-hidden relative py-5 md:py-6 -mt-px">
      {/* Enhanced gradient background with depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-primary/8 to-background" />
      
      {/* Animated gradient overlay for shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse opacity-50" />
      
      {/* Premium border treatment */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      {/* Fade edges for premium look */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Marquee container - inline animation avoids hydration mismatch, runs immediately */}
      <div
        className="flex whitespace-nowrap gap-12 relative z-0 hover:[animation-play-state:paused]"
        style={{ animation: "marquee 40s linear infinite" }}
      >
        {/* Original set with enhanced styling */}
        {features.map((feature, index) => (
          <div 
            key={`original-${index}`} 
            className="flex items-center gap-3 px-4 py-2 group transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            {/* Animated icon container */}
            <div className="flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary group-hover:text-primary/90 transition-all duration-300 group-hover:animate-pulse group-hover:drop-shadow-lg" />
            </div>
            
            {/* Feature text with enhanced typography */}
            <span className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-all duration-300 uppercase tracking-widest whitespace-nowrap">
              {feature}
            </span>
            
            {/* Subtle background on hover */}
            <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}

        {/* Duplicate set for seamless loop */}
        {features.map((feature, index) => (
          <div 
            key={`duplicate-${index}`} 
            className="flex items-center gap-3 px-4 py-2 group transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            {/* Animated icon container */}
            <div className="flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary group-hover:text-primary/90 transition-all duration-300 group-hover:animate-pulse group-hover:drop-shadow-lg" />
            </div>
            
            {/* Feature text with enhanced typography */}
            <span className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-all duration-300 uppercase tracking-widest whitespace-nowrap">
              {feature}
            </span>
            
            {/* Subtle background on hover */}
            <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarqueeStrip;