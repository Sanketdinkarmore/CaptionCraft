import type { ReactNode } from "react";

interface FloatingBadgeProps {
  children: ReactNode;
  className?: string;
  rotate?: number;
  /** When true, hides from screen readers (for decorative badges) to avoid "contains emphasized elements" and similar a11y notes. */
  decorative?: boolean;
}

const FloatingBadge = ({ children, className = "", rotate = 0, decorative = false }: FloatingBadgeProps) => {
  return (
    <div 
      className={`badge-sticker bg-accent text-accent-foreground animate-float shadow-lg ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden={decorative ? true : undefined}
    >
      {children}
    </div>
  );
};

export default FloatingBadge;
