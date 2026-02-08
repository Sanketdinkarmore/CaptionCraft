"use client";

import FeatureCard from "./FeatureCard";
import featureUpload from "@/assets/feature-upload.png";
import featureAi from "@/assets/feature-ai.png";
import featureCustomize from "@/assets/feature-customize.png";
import featureExport from "@/assets/feature-export.png";
import { Upload, Zap, Palette, Download } from "lucide-react";

const features = [
  {
    image: featureUpload,
    title: "Upload Your Video",
    description: "Simply drag and drop any video file. We handle all formats.",
    icon: <Upload className="w-5 h-5 text-primary-foreground" />,
  },
  {
    image: featureAi,
    title: "AI Hinglish Magic",
    description: "Intelligent transcription for perfect mixed-language subtitles.",
    icon: <Zap className="w-5 h-5 text-primary-foreground" />,
  },
  {
    image: featureCustomize,
    title: "Endless Customization",
    description: "Fonts, colors, timing, and positioning—complete creative control.",
    icon: <Palette className="w-5 h-5 text-primary-foreground" />,
  },
  {
    image: featureExport,
    title: "Export Anywhere",
    description: "SRT files, burned-in videos, or use our player. Your choice.",
    icon: <Download className="w-5 h-5 text-primary-foreground" />,
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-12 md:py-16 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-72 h-72 bg-primary/15 rounded-full blur-3xl opacity-40 animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section header - Bold and modern */}
        <div className="max-w-2xl mb-8 md:mb-12 animate-fade-in-up">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">FEATURES</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
            Everything you need to <span className="text-primary">captivate</span> your audience
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From upload to export, our workflow is designed for creators who want results <span className="text-foreground font-medium">fast</span> and <span className="text-foreground font-medium">beautiful</span>.
          </p>
        </div>

        {/* Asymmetrical grid layout - Breaking the standard 4-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Feature 1 - Standard size */}
          <div className="lg:row-span-1">
            <FeatureCard {...features[0]} index={0} />
          </div>

          {/* Feature 2 - Spans larger */}
          <div className="md:col-span-1">
            <FeatureCard {...features[1]} index={1} />
          </div>

          {/* Feature 3 - Standard */}
          <div className="lg:col-start-3">
            <FeatureCard {...features[2]} index={2} />
          </div>

          {/* Feature 4 - Right aligned */}
          <div>
            <FeatureCard {...features[3]} index={3} />
          </div>
        </div>

        {/* Stats block - tighter spacing */}
        <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-border/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {/* Stat 1 */}
            <div className="bg-card/50 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md hover:scale-105 transition-transform duration-300">
              <p className="text-4xl font-black text-primary mb-3">10,000+</p>
              <p className="text-sm text-muted-foreground font-medium">Creators worldwide</p>
            </div>

            {/* Stat 2 */}
            <div className="bg-card/50 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md hover:scale-105 transition-transform duration-300">
              <p className="text-4xl font-black text-primary mb-3">2 Min</p>
              <p className="text-sm text-muted-foreground font-medium">Average processing time</p>
            </div>

            {/* Stat 3 */}
            <div className="bg-card/50 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md hover:scale-105 transition-transform duration-300">
              <p className="text-4xl font-black text-primary mb-3">99.9%</p>
              <p className="text-sm text-muted-foreground font-medium">Accuracy rate</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;