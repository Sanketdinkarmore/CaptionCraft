"use client";

import { ArrowRight } from "lucide-react";

type FeatureImage = string | { src: string };

interface FeatureCardProps {
  image: FeatureImage;
  title: string;
  description: string;
  icon?: React.ReactNode;
  index?: number;
}

const FeatureCard = ({ image, title, description, icon, index = 0 }: FeatureCardProps) => {
  const imageSrc = typeof image === "string" ? image : image.src;

  return (
    <div 
      className="relative h-full animate-fade-in-up group"
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      {/* Background gradient on hover - pops outward */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur group-hover:scale-110" />
      
      {/* Shadow glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      <div className="feature-card bg-card/60 backdrop-blur-md overflow-hidden flex flex-col rounded-2xl border border-white/10 transition-all duration-500 group-hover:border-primary/30 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-primary/20">
        {/* Image container with overlay */}
        <div className="relative aspect-video overflow-hidden bg-muted/30">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2"
          />
          
          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Icon badge - bounces in on hover */}
          {icon && (
            <div className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110 group-hover:animate-bounce" style={{ animationDelay: '0.1s' }}>
              {icon}
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors duration-300 group-hover:scale-105 origin-left">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1 group-hover:text-foreground/80 transition-colors duration-300">
            {description}
          </p>
          
          {/* CTA arrow - slides in on hover */}
          <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transform group-hover:translate-x-2 transition-all duration-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Learn More</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>

        {/* Bottom accent line - animates on hover */}
        <div className="h-1 w-0 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-700" />
      </div>
    </div>
  );
};

export default FeatureCard;