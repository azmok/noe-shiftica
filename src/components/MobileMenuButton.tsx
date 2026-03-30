"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { useHearingData } from "@/hooks/useHearingData";

export function MobileMenuButton() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const { hasData: hasHearingData } = useHearingData();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isDarkTheme = pathname === "/" || pathname === "/about" || pathname === "/services" || pathname === "/hearing";

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

  // ヒアリングページでも表示するように変更
  // if (pathname === '/hearing') return null;

  return (
    <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className={`md:hidden fixed bottom-6 left-6 z-9999 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } ${isDarkTheme
          ? isMobileMenuOpen
            ? "shadow-[inset_2px_2px_4px_#0a0a0a,inset_-2px_-2px_4px_#181818] bg-[#111111] text-white border border-[oklch(27.4%_0.006_286.033)]"
            : "shadow-[4px_4px_10px_#0a0a0a,-4px_-4px_10px_#181818] bg-[#111111] text-white/80 border border-[oklch(27.4%_0.006_286.033)]"
          : isMobileMenuOpen
            ? "shadow-[inset_2px_2px_4px_#D0CDC7,inset_-2px_-2px_4px_#FDFCFA] bg-(--mobile-surface) text-(--mobile-text-primary)"
            : "shadow-[4px_4px_10px_#D8D5CF,-4px_-4px_10px_#FFFFFF] bg-(--mobile-surface) text-(--mobile-text-primary)"
        }`}
      aria-label="Toggle Menu"
    >
      {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      {hasHearingData && !isMobileMenuOpen && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#E2FF3D] rounded-full border border-black/20 shadow-sm" />
      )}
    </button>
  );
}
