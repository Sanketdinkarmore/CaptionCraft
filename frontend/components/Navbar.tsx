"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authClient";
import { useState } from "react";

const Navbar = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleTryFree = () => {
    const token = getToken();
    if (token) {
      router.push("/editor");
    } else {
      router.push("/login");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-xl border-b border-border/30 hover:bg-background/50 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo - Modernized */}
        <div 
          className="flex items-center gap-3 group cursor-pointer hover:scale-105 transition-transform"
          onClick={() => router.push("/")}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-black text-foreground hidden sm:inline tracking-tight">CaptionCraft</span>
        </div>
        
        {/* Navigation Links - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-12">
          <a 
            href="#features" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full transition-colors"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full transition-colors"
          >
            How It Works
          </a>
          <a 
            href="#pricing" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full transition-colors"
          >
            Pricing
          </a>
        </div>
        
        {/* Right side - CTA Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground font-medium transition-colors" 
            onClick={handleLogin}
          >
            Login
          </Button>
          <Button 
            variant="hero" 
            size="sm" 
            className="rounded-lg font-bold uppercase tracking-wider shadow-lg hover:shadow-xl"
            onClick={handleTryFree}
          >
            Try Free
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu - Appears below navbar */}
      {isOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-md border-b border-border/50 animate-fade-in-up">
          <div className="container mx-auto px-4 py-4 space-y-3 max-w-7xl">
            <a 
              href="#features" 
              className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#pricing" 
              className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Pricing
            </a>
            <div className="pt-3 border-t border-border space-y-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-center text-muted-foreground hover:text-foreground"
                onClick={handleLogin}
              >
                Login
              </Button>
              <Button 
                variant="hero" 
                size="sm"
                className="w-full rounded-lg font-bold"
                onClick={handleTryFree}
              >
                Try Free
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;