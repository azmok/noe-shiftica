"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, User } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down (and past initial top padding threshold)
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);
  
  // Hide nav on route change
  useEffect(() => {
    setIsVisible(false);
  }, [pathname]);
  
  // Allow rendering on LP, About, Privacy, Terms, and all Blog pages
  const isAllowed = 
    pathname === "/" || 
    pathname === "/about" || 
    pathname === "/privacy" || 
    pathname === "/terms" || 
    pathname?.startsWith("/blog");
  
  if (!isAllowed) return null;

  const isDarkTheme = pathname === "/" || pathname === "/about";

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t flex items-center justify-around px-4 pb-8 pt-3 pb-safe transition-transform duration-300 ease-in-out ${
      isVisible ? "translate-y-0" : "translate-y-full"
    } ${isDarkTheme ? "bg-background-void border-white/10" : "bg-(--mobile-bg) border-black/5"}`}>
      <Link href="/" className="flex flex-col items-center gap-1 group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isDarkTheme
            ? pathname === "/" 
              ? "shadow-[inset_2px_2px_4px_#0a0a0a,inset_-2px_-2px_4px_#181818] bg-[#111111]" 
              : "shadow-[2px_2px_5px_#0a0a0a,-2px_-2px_5px_#181818] bg-[#111111]"
            : pathname === "/" 
              ? "shadow-[inset_2px_2px_4px_#D0CDC7,inset_-2px_-2px_4px_#FDFCFA] bg-(--mobile-surface)" 
              : "shadow-[2px_2px_5px_#D8D5CF,-2px_-2px_5px_#FFFFFF] bg-(--mobile-surface)"
        }`}>
          <Home size={18} className={
            isDarkTheme
              ? pathname === "/" ? "text-[#FFFFFF]" : "text-white/40"
              : pathname === "/" ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
          } />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          isDarkTheme
            ? pathname === "/" ? "text-[#FFFFFF]" : "text-white/40"
            : pathname === "/" ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
        }`}>
          Home
        </span>
      </Link>

      <Link href="/blog" className="flex flex-col items-center gap-1 group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isDarkTheme
            ? pathname === "/blog" || (pathname?.startsWith("/blog") && pathname !== "/blog")
              ? "shadow-[inset_2px_2px_4px_#0a0a0a,inset_-2px_-2px_4px_#181818] bg-[#111111]" 
              : "shadow-[2px_2px_5px_#0a0a0a,-2px_-2px_5px_#181818] bg-[#111111]"
            : pathname === "/blog" || (pathname?.startsWith("/blog") && pathname !== "/blog")
              ? "shadow-[inset_2px_2px_4px_#D0CDC7,inset_-2px_-2px_4px_#FDFCFA] bg-(--mobile-surface)" 
              : "shadow-[2px_2px_5px_#D8D5CF,-2px_-2px_5px_#FFFFFF] bg-(--mobile-surface)"
        }`}>
          <FileText size={18} className={
            isDarkTheme
              ? pathname?.startsWith("/blog") ? "text-[#FFFFFF]" : "text-white/40"
              : pathname?.startsWith("/blog") ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
          } />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          isDarkTheme
            ? pathname?.startsWith("/blog") ? "text-[#FFFFFF]" : "text-white/40"
            : pathname?.startsWith("/blog") ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
        }`}>
          Blog
        </span>
      </Link>

      <Link href="/about" className="flex flex-col items-center gap-1 group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isDarkTheme
            ? pathname === "/about" 
              ? "shadow-[inset_2px_2px_4px_#0a0a0a,inset_-2px_-2px_4px_#181818] bg-[#111111]" 
              : "shadow-[2px_2px_5px_#0a0a0a,-2px_-2px_5px_#181818] bg-[#111111]"
            : pathname === "/about" 
              ? "shadow-[inset_2px_2px_4px_#D0CDC7,inset_-2px_-2px_4px_#FDFCFA] bg-(--mobile-surface)" 
              : "shadow-[2px_2px_5px_#D8D5CF,-2px_-2px_5px_#FFFFFF] bg-(--mobile-surface)"
        }`}>
          <User size={18} className={
            isDarkTheme
              ? pathname === "/about" ? "text-[#FFFFFF]" : "text-white/40"
              : pathname === "/about" ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
          } />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          isDarkTheme
            ? pathname === "/about" ? "text-[#FFFFFF]" : "text-white/40"
            : pathname === "/about" ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
        }`}>
          About
        </span>
      </Link>
    </nav>
  );
}
