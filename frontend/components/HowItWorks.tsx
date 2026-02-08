"use client";

import { useState, useEffect } from "react";
import { Volume2, CheckCircle2, Upload, Play, ArrowRight, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authClient";

const steps = [
  {
    number: "01",
    title: "Upload Your Video",
    description: "Drag and drop your video file or select from your computer",
    icon: Upload,
    color: "from-purple-100/40 to-transparent",
    gradient: "from-purple-600 to-purple-500",
    demoTitle: "Upload Video",
    demoDescription: "Choose your video file to get started",
  },
  {
    number: "02",
    title: "AI Generates Captions",
    description: "Our AI automatically transcribes and creates captions in seconds",
    icon: Volume2,
    color: "from-pink-100/40 to-transparent",
    gradient: "from-pink-600 to-purple-500",
    demoTitle: "AI Processing",
    demoDescription: "Watch as our AI transcribes your video in real-time",
  },
  {
    number: "03",
    title: "Customize & Export",
    description: "Add custom fonts, colors, and timing adjustments with ease",
    icon: CheckCircle2,
    color: "from-purple-100/40 to-transparent",
    gradient: "from-purple-600 to-pink-500",
    demoTitle: "Customize & Export",
    demoDescription: "Add custom fonts, colors, and timing adjustments with ease",
  },
];

const HowItWorks = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showInfoBox, setShowInfoBox] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setSelectedTab((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const currentStep = steps[selectedTab];
  const CurrentIcon = currentStep.icon;

  const handleTabClick = (index: number) => {
    setSelectedTab(index);
    setAutoPlay(false);
  };

  const handleGetStarted = () => {
    const token = getToken();
    router.push(token ? "/editor" : "/login");
  };

  return (
    <section id="how-it-works" className="relative py-16 md:py-24 px-4 overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] hiw-section-bg-orb-1-light rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] hiw-section-bg-orb-2-light rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] hiw-section-bg-orb-3-light rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>How it works</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="block text-slate-900 mb-2">See How It</span>
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Works in 3 Steps
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Transform your workflow and create professional captions in minutes, not hours
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-stretch relative">
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                onClick={() => handleTabClick(index)}
                className={`group relative p-6 md:p-7 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden ${
                  selectedTab === index
                    ? "hiw-step-card-active-light shadow-lg scale-[1.02]"
                    : "hiw-step-card-inactive-light hover:scale-[1.01]"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none ${
                    selectedTab === index ? "opacity-100" : ""
                  }`}
                />

                <div className="relative z-10 flex items-start gap-5">
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      selectedTab === index
                        ? "hiw-step-icon-active-light scale-110"
                        : "hiw-step-icon-inactive-light group-hover:scale-105"
                    }`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-2xl font-black mb-2 transition-all duration-500 ${
                        selectedTab === index
                          ? `bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent`
                          : "text-slate-400"
                      }`}
                    >
                      {step.number}
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2 transition-colors duration-500">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                    {selectedTab === index && (
                      <div className="mt-3 flex items-center gap-2 text-purple-600 text-sm font-medium">
                        <span>Click to explore</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2 mt-6 justify-center lg:justify-start">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleTabClick(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    selectedTab === index
                      ? "hiw-progress-active-light w-8"
                      : "hiw-progress-inactive-light w-2"
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center relative">
            <div className="relative rounded-3xl border-2 hiw-demo-box-light overflow-hidden transition-all duration-500 shadow-lg">
              <div className="absolute inset-0 hiw-demo-bg-light opacity-40" />

              <div className="relative aspect-video flex flex-col p-8 md:p-10 bg-gradient-to-br from-white via-purple-50/30 to-white backdrop-blur-sm justify-between">
                <div className="flex items-center gap-3 hiw-demo-pill-light backdrop-blur-md rounded-xl px-5 py-3 w-fit mb-6 transition-all duration-500 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="relative w-3 h-3">
                      <div className="absolute inset-0 rounded-full bg-purple-500 animate-pulse" />
                      <div className="absolute inset-0.5 rounded-full bg-purple-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {currentStep.title}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  {selectedTab === 0 && (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-200/40 to-pink-200/30 blur-2xl" />
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl border-2 border-dashed hiw-upload-zone-light flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors duration-300 group">
                          <Upload className="w-10 h-10 md:w-14 md:h-14 text-purple-400 group-hover:text-purple-600 group-hover:scale-110 transition-all duration-300" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-base font-semibold text-slate-900">Drop your video here</p>
                        <p className="text-sm text-slate-500">or click to browse</p>
                      </div>
                    </div>
                  )}

                  {selectedTab === 1 && (
                    <div className="w-full max-w-sm space-y-5 animate-in fade-in zoom-in duration-500">
                      <div className="hiw-caption-box-light backdrop-blur-lg rounded-2xl p-6 space-y-4 border-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-purple-600" />
                          <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Auto-Caption</p>
                        </div>
                        <div className="space-y-3">
                          {[0.6, 0.8, 0.7].map((width, i) => (
                            <div key={i} className="space-y-1">
                              <div
                                className="h-3 bg-gradient-to-r from-purple-300/50 via-pink-200/30 to-transparent rounded-full animate-pulse"
                                style={{
                                  width: `${width * 100}%`,
                                  animationDelay: `${i * 150}ms`,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-center pt-2">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-80 transition-all duration-300 scale-100 group-hover:scale-110" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPlaying(!isPlaying);
                            }}
                            className="relative w-16 h-16 rounded-full hiw-play-btn-light flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            {isPlaying ? (
                              <div className="flex gap-1">
                                <div className="w-1 h-4 bg-white rounded-full animate-pulse" />
                                <div className="w-1 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                              </div>
                            ) : (
                              <Play className="w-7 h-7 text-white fill-white ml-1" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTab === 2 && (
                    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Font Sizes</p>
                        <div className="flex gap-4">
                          {["A", "Aa", "AAA"].map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              className="group relative w-12 h-12 rounded-lg hiw-font-pill-light border-2 flex items-center justify-center text-sm font-bold hover:scale-110 transition-transform duration-300 shadow-sm"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Colors</p>
                        <div className="flex gap-4">
                          <button type="button" className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 border-2 border-white shadow-md hover:scale-110 transition-transform duration-300 hover:shadow-lg" />
                          <button type="button" className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-white shadow-md hover:scale-110 transition-transform duration-300 hover:shadow-lg" />
                          <button type="button" className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 border-2 border-white shadow-md hover:scale-110 transition-transform duration-300 hover:shadow-lg" />
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 font-medium">Fonts • Colors • Timing</p>
                    </div>
                  )}
                </div>

                <div className="text-center text-xs text-slate-500 font-medium">
                  {selectedTab === 0 && "Customize & Export"}
                  {selectedTab === 1 && ""}
                  {selectedTab === 2 && "Font • Color • Timing"}
                </div>
              </div>
            </div>

            {showInfoBox && (
              <div className="absolute bottom-8 right-8 md:bottom-auto md:right-auto md:top-1/3 md:-right-32 w-72 z-30 animate-in fade-in slide-in-from-right duration-500">
                <div className="rounded-2xl shadow-2xl border-2 border-purple-400 relative overflow-hidden group bg-white">
                  <button
                    type="button"
                    onClick={() => setShowInfoBox(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-purple-100 rounded-lg transition-all z-40"
                  >
                    <X className="w-5 h-5 text-purple-600 font-bold" />
                  </button>

                  <div className="p-6 space-y-4 relative z-20">
                    <div className="flex items-start gap-3 pr-6">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <CurrentIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-purple-600">Step</p>
                        <p className="text-4xl font-black text-purple-600">{selectedTab + 1}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="text-xl font-black text-purple-700">{currentStep.demoTitle}</h3>
                      <p className="text-sm leading-relaxed font-bold text-slate-700">
                        {currentStep.demoDescription}
                      </p>
                    </div>

                    {selectedTab === 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="px-3 py-1.5 bg-purple-100 rounded-full text-xs font-black text-purple-700 border-2 border-purple-400">
                          Drag & Drop
                        </span>
                        <span className="px-3 py-1.5 bg-purple-100 rounded-full text-xs font-black text-purple-700 border-2 border-purple-400">
                          MP4, MOV
                        </span>
                      </div>
                    )}

                    {selectedTab === 1 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="px-3 py-1.5 bg-purple-100 rounded-full text-xs font-black text-purple-700 border-2 border-purple-400">
                          AI Power
                        </span>
                        <span className="px-3 py-1.5 bg-purple-100 rounded-full text-xs font-black text-purple-700 border-2 border-purple-400">
                          Instant
                        </span>
                      </div>
                    )}

                    {selectedTab === 2 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="px-3 py-1.5 bg-purple-100 rounded-full text-xs font-black text-purple-700 border-2 border-purple-400">
                          Font
                        </span>
                        <span className="px-3 py-1.5 bg-purple-100 rounded-full text-xs font-black text-purple-700 border-2 border-purple-400">
                          Color
                        </span>
                        <span className="px-3 py-1.5 bg-purple-100 rounded-full text-xs font-black text-purple-700 border-2 border-purple-400">
                          Timing
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGetStarted}
                      className="w-full mt-4 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 font-black transition-all duration-300 text-sm border-2 border-purple-600 text-white"
                    >
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 text-center">
          <button
            type="button"
            onClick={handleGetStarted}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl hiw-cta-btn-light font-semibold text-base shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-white"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
