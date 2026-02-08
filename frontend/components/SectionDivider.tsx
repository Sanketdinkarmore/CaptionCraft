"use client";

interface SectionDividerProps {
  className?: string;
  variant?: "subtle" | "gradient" | "none";
}

const SectionDivider = ({ className = "", variant = "gradient" }: SectionDividerProps) => {
  if (variant === "none") return null;

  return (
    <div className={`w-full py-0 ${className}`} aria-hidden>
      <div
        className={`h-px w-full max-w-2xl mx-auto ${
          variant === "gradient"
            ? "bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            : "bg-border/50"
        }`}
      />
    </div>
  );
};

export default SectionDivider;
