"use client";

import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authClient";

// Use Cloudinary URL for faster CDN loading (recommended). Your cloud: drsitovda
// Set NEXT_PUBLIC_CTA_VIDEO_URL in .env.local when you upload to Cloudinary
// e.g. https://res.cloudinary.com/drsitovda/video/upload/f_auto,q_auto/v1/captioncraft/cta-video.mp4
const CTA_VIDEO_SRC =
  process.env.NEXT_PUBLIC_CTA_VIDEO_URL 

const CTABanner = () => {
  const router = useRouter();

  const handleStart = () => {
    const token = getToken();
    router.push(token ? "/editor" : "/login");
  };

  return (
    <section className="px-4 py-8 md:py-12 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10">
          {/* Base gradient background */}
          <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-background to-accent/15" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.12)_0%,transparent_50%)]" />
          
          {/* Decorative grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 2px),
                               linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative grid grid-cols-1 md:grid-cols-12 gap-0 min-h-[280px] md:min-h-[320px]">
            {/* Content - left side */}
            <div className="md:col-span-7 flex flex-col justify-center px-6 py-10 md:px-12 md:py-12 md:pr-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 w-fit mb-5">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Free to start
                </span>
              </div>

              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight">
                Ready to captivate
                <br />
                <span className="bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  your audience?
                </span>
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md text-base md:text-lg">
                Join thousands of creators. No credit card required.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3 mb-6">
                <Button
                  variant="hero"
                  size="xl"
                  className="rounded-xl font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 w-full sm:w-auto border-4"
                  onClick={handleStart}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Creating Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>2 min setup</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span>10,000+ creators</span>
              </div>
            </div>

            {/* Video - right side - visible on md+ screens */}
            <div className="hidden md:flex lg:col-span-5 relative items-stretch justify-center p-6 overflow-hidden min-h-[200px]">
              <div className="relative w-full min-w-[200px] min-h-[200px] rounded-2xl overflow-hidden border border-primary/20 shadow-xl ring-2 ring-primary/10">
                <video
                  src={CTA_VIDEO_SRC}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  preload="metadata"
                  aria-label="CaptionCraft demo - creative video captions"
                />
                <div className="absolute inset-0 bg-linear-to-l from-background/40 via-transparent to-transparent" />
                {/* Subtle overlay card */}
                <div className="absolute bottom-4 right-4 left-4 bg-background/80 backdrop-blur-md rounded-xl p-3 border border-border/40 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-medium text-foreground">Captions ready in seconds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
