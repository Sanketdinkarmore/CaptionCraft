"use client";

import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-video-editing.png";
import { ArrowRight, Play, Sparkles, Star, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authClient";
import { useEffect, useState } from "react";

const heroWords = ["effortless", "loud", "on-brand"];

const TypewriterHeadline = () => {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const currentWord = heroWords[wordIndex];
    let typingId: number | undefined;
    let holdId: number | undefined;

    if (prefersReduced) {
      setText(currentWord);
      holdId = window.setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % heroWords.length);
      }, 2000);
    } else {
      setText("");
      let charIndex = 0;

      typingId = window.setInterval(() => {
        charIndex += 1;
        setText(currentWord.slice(0, charIndex));

        if (charIndex >= currentWord.length && typingId !== undefined) {
          window.clearInterval(typingId);
          typingId = undefined;

          holdId = window.setTimeout(() => {
            setWordIndex((prev) => (prev + 1) % heroWords.length);
          }, 1200);
        }
      }, 90);
    }

    return () => {
      if (typingId !== undefined) {
        window.clearInterval(typingId);
      }
      if (holdId !== undefined) {
        window.clearTimeout(holdId);
      }
    };
  }, [wordIndex, prefersReduced]);

  return (
    <span className="hero-gradient-text inline-block min-w-[7ch]">
      {text || "\u00A0"}
    </span>
  );
};

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

  const handleSeeDemo = () => {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Fallback: route if the section doesn't exist on this page.
    router.push("/#how-it-works");
  };

  const heroImageSrc = typeof heroImage === "string" ? heroImage : heroImage.src;

  return (
    <section className="relative overflow-hidden px-4 pt-24 pb-10 md:pb-16 min-h-[85vh] flex items-center">
      {/* Background: aurora + blobs + subtle grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-60 hero-aurora motion-reduce:opacity-30" />
        <div className="absolute inset-0 hero-grid opacity-[0.15]" />

        <div className="absolute -top-24 -left-44 h-80 w-80 rounded-full bg-primary/25 blur-3xl opacity-40 animate-morph motion-reduce:animate-none" />
        <div
          className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-accent/30 blur-3xl opacity-35 animate-float motion-reduce:animate-none"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute -bottom-36 left-1/2 h-80 w-80 rounded-full bg-primary/15 blur-3xl opacity-30 animate-float motion-reduce:animate-none" style={{ animationDelay: "1.8s" }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left Column - Content */}
          <div className="space-y-7 md:space-y-9">
            {/* Top pill */}
            <div className="inline-block animate-fade-in-up motion-reduce:animate-none">
              <button
                type="button"
                onClick={handleSeeDemo}
                className="group flex items-center gap-2 rounded-full border border-primary/25 bg-card/40 px-4 py-2 backdrop-blur-md shadow-sm hover:bg-card/60 hover:border-primary/35 transition-colors"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Sparkles className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  Captions in Hindi, Marathi, Hinglish & English
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">• export SRT / MP4</span>
                <ArrowRight className="h-4 w-4 text-primary/70 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Main Headline - Bold and distinctive */}
            <div className="space-y-5 animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: "0.08s" }}>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-foreground">
                <span className="block">
                  Make captions
                </span>
                <span className="block">
                  feel{" "}
                  <TypewriterHeadline />
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Drop a clip → get <span className="text-foreground font-semibold">subtitles in Hindi, Marathi, Hinglish, or polished English</span> with clean timing, on-brand styles, and instant exports.
              </p>
            </div>

            {/* Quick value props */}
            <div className="flex flex-wrap gap-2 animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: "0.16s" }}>
              {[
                { label: "Auto-sync", icon: <Zap className="h-4 w-4" /> },
                { label: "Reels-style presets", icon: <Sparkles className="h-4 w-4" /> },
                { label: "4 languages", icon: <span className="text-[13px] font-bold">ह • मर • En</span> },
                { label: "One-click export", icon: <ArrowRight className="h-4 w-4" /> },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-sm text-foreground backdrop-blur-md shadow-xs hover:bg-card/60 transition-colors"
                >
                  <span className="text-primary">{chip.icon}</span>
                  <span className="font-medium">{chip.label}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons - Bold and modern */}
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 pt-2 animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: "0.24s" }}>
              <Button
                variant="hero"
                size="xl"
                className="rounded-2xl font-extrabold tracking-wide shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0"
                onClick={handleStartCreating}
              >
                <Play className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                Create captions
              </Button>
              <Button
                variant="heroOutline"
                size="xl"
                className="rounded-2xl font-semibold transition-all hover:translate-x-0.5"
                onClick={handleSeeDemo}
              >
                Watch a quick demo
                <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
              </Button>
            </div>

            {/* Social proof */}
            <div className="pt-7 border-t border-border/50 animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: "0.32s" }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-primary">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-foreground font-semibold">4.9</span>
                  <span className="text-sm text-muted-foreground">from creators</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["A", "K", "S", "R"].map((initial, i) => (
                      <div
                        key={initial}
                        className="h-10 w-10 rounded-full border-2 border-background bg-card/70 backdrop-blur flex items-center justify-center text-sm font-bold text-foreground shadow-sm"
                        style={{ transform: `translateY(${i % 2 === 0 ? 0 : 2}px)` }}
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-foreground font-semibold">10k+ exports</span>
                  <span className="text-sm text-muted-foreground hidden sm:inline">this month</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                No credit card. Keep your vibe. Ship faster.
              </p>
            </div>
          </div>

          {/* Right Column - Hero Image with floating elements */}
          <div className="relative h-full min-h-[420px] sm:min-h-[520px] lg:min-h-[640px] animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: "0.12s" }}>
            {/* Floating background elements */}
            <div className="absolute -top-24 -right-20 h-72 w-72 bg-primary/10 rounded-3xl blur-2xl rotate-45 animate-float motion-reduce:animate-none" />
            <div className="absolute -bottom-40 left-1/2 h-96 w-96 bg-accent/15 rounded-full blur-3xl animate-float motion-reduce:animate-none" style={{ animationDelay: "1.4s" }} />

            <div className="relative h-full flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-lg lg:max-w-md">
                {/* Animated border frame */}
                <div className="rounded-[28px] p-px hero-animated-border shadow-2xl">
                  <div className="rounded-[27px] bg-card/55 backdrop-blur-xl border border-white/10 overflow-hidden">
                    <div className="relative">
                      <img
                        src={heroImageSrc}
                        alt="Video editing workspace with multilingual subtitles"
                        className="w-full h-auto"
                      />

                      {/* Overlay UI: caption preview */}
                      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
                        <div className="rounded-2xl bg-background/70 backdrop-blur-md border border-border/50 p-3 sm:p-4 shadow-lg">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold tracking-wide">
                                PREVIEW
                              </p>
                              <p className="mt-1 text-sm sm:text-base font-semibold text-foreground truncate">
                                “Bro, ye scene toh cinematic hai…”
                              </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 font-semibold">
                                <Zap className="h-3.5 w-3.5" />
                                Auto
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent/50 px-2 py-1 font-semibold">
                                SRT
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Soft highlight */}
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/0 opacity-70" />
                    </div>
                  </div>
                </div>

                {/* Floating chips (hidden on small to avoid clutter) */}
                <div className="hidden sm:block">
                  <div className="absolute -top-6 -left-6 rounded-2xl bg-card/60 border border-white/10 px-4 py-3 shadow-xl backdrop-blur-md animate-float motion-reduce:animate-none" style={{ animationDelay: "0.7s" }}>
                    <p className="text-xs font-bold text-foreground tracking-wide">AUTO-SYNC</p>
                    <p className="text-xs text-muted-foreground mt-0.5">no manual timing</p>
                  </div>

                  <div className="absolute -bottom-6 -right-5 rounded-2xl bg-primary text-primary-foreground px-5 py-3 shadow-xl animate-float motion-reduce:animate-none" style={{ animationDelay: "1.05s" }}>
                    <p className="text-sm font-black leading-none">1-click</p>
                    <p className="text-xs opacity-90 mt-1">export MP4</p>
                  </div>

                  <div className="absolute top-1/2 -right-10 rounded-full bg-card/60 border border-white/10 px-4 py-3 shadow-lg backdrop-blur-md animate-float motion-reduce:animate-none" style={{ animationDelay: "0.9s" }}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">aesthetic presets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decoration - flows into marquee */}
        <div className="mt-10 md:mt-14 pt-7 border-t border-border/30 flex items-center justify-center gap-3 animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: "0.4s" }}>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            built for reels, podcasts, edits
          </span>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-border to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;