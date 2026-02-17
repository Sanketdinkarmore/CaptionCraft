"use client";

import { Github, Twitter, Linkedin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card/50 backdrop-blur-md border-t border-border/30 py-12 md:py-14 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 mb-10">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src={typeof logo === "string" ? logo : logo.src}
                alt="CaptionCraft logo"
                className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
              />
              <span className="text-lg font-black text-foreground">CaptionCraft</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Smart Hinglish subtitles for creators who want to move fast.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 pt-4">
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Product</h3>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'How It Works', 'Blog'].map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Company</h3>
            <ul className="space-y-2">
              {['About', 'Contact', 'Careers', 'Press'].map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              {['Privacy', 'Terms', 'Security', 'Cookies'].map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-linear-to-r from-transparent via-border to-transparent mb-2" />

        {/* Bottom footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} CaptionCraft. All rights reserved.
          </p>
          
          {/* <p className="text-xs text-muted-foreground">
            Made with <span className="text-primary">♥</span> for creators worldwide
          </p> */}

          {/* Scroll to top button */}
          {/* <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors duration-300 uppercase tracking-wider"
          >
            Back to Top ↑
          </button> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;