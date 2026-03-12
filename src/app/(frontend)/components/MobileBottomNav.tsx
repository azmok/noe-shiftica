"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, User } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  
  // Allow rendering on LP, About, Privacy, Terms, and all Blog pages
  const isAllowed = 
    pathname === "/" || 
    pathname === "/about" || 
    pathname === "/privacy" || 
    pathname === "/terms" || 
    pathname?.startsWith("/blog");
  
  if (!isAllowed) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-100 bg-(--mobile-bg) border-t border-black/5 flex items-center justify-around px-4 pb-8 pt-3 pb-safe">
      <Link href="/" className="flex flex-col items-center gap-1 group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          pathname === "/" ? "shadow-[inset_2px_2px_4px_#D0CDC7,inset_-2px_-2px_4px_#FDFCFA]" : "shadow-[2px_2px_5px_#D8D5CF,-2px_-2px_5px_#FFFFFF]"
        } bg-(--mobile-surface)`}>
          <Home size={18} className={pathname === "/" ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          pathname === "/" ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
        }`}>
          Home
        </span>
      </Link>

      <Link href="/blog" className="flex flex-col items-center gap-1 group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          pathname === "/blog" || (pathname?.startsWith("/blog") && pathname !== "/blog") ? "shadow-[inset_2px_2px_4px_#D0CDC7,inset_-2px_-2px_4px_#FDFCFA]" : "shadow-[2px_2px_5px_#D8D5CF,-2px_-2px_5px_#FFFFFF]"
        } bg-(--mobile-surface)`}>
          <FileText size={18} className={pathname?.startsWith("/blog") ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          pathname?.startsWith("/blog") ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
        }`}>
          Blog
        </span>
      </Link>

      <Link href="/about" className="flex flex-col items-center gap-1 group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          pathname === "/about" ? "shadow-[inset_2px_2px_4px_#D0CDC7,inset_-2px_-2px_4px_#FDFCFA]" : "shadow-[2px_2px_5px_#D8D5CF,-2px_-2px_5px_#FFFFFF]"
        } bg-(--mobile-surface)`}>
          <User size={18} className={pathname === "/about" ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          pathname === "/about" ? "text-(--mobile-text-primary)" : "text-(--mobile-text-muted)"
        }`}>
          About
        </span>
      </Link>
    </nav>
  );
}
