"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useMobileMenu } from "@/context/MobileMenuContext";

export function MobileMenuButton() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isDarkTheme = pathname === "/" || pathname === "/about" || pathname === "/services";

  // スクロール検知
  useEffect(() => {
    const handleScroll = () => {
      // メニューオープン中は非表示にしない
      if (isMobileMenuOpen) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      
      // 50px以上スクロールしている場合のみダウン/アップ判定
      if (currentScrollY < lastScrollY) {
        // Scrolled UP: Show
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolled DOWN & exceeded threshold: Hide
        setIsVisible(false);
      } else if (currentScrollY <= 50) {
        // Top area: Show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobileMenuOpen]);

  // ルート変更時に表示にリセット
  useEffect(() => {
    setIsVisible(true);
  }, [pathname]);

  return (
    <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className={`md:hidden fixed bottom-6 left-6 z-100 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
        isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      } ${
        isDarkTheme
          ? isMobileMenuOpen
            ? "shadow-[inset_2px_2px_4px_#0a0a0a,inset_-2px_-2px_4px_#181818] bg-[#111111] text-white"
            : "shadow-[4px_4px_10px_#0a0a0a,-4px_-4px_10px_#181818] bg-[#111111] text-white/80"
          : isMobileMenuOpen
            ? "shadow-[inset_2px_2px_4px_#D0CDC7,inset_-2px_-2px_4px_#FDFCFA] bg-(--mobile-surface) text-(--mobile-text-primary)"
            : "shadow-[4px_4px_10px_#D8D5CF,-4px_-4px_10px_#FFFFFF] bg-(--mobile-surface) text-(--mobile-text-primary)"
      }`}
      aria-label="Toggle Menu"
    >
      {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  );
}
