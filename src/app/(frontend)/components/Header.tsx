"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/Button";

interface HeaderProps {
  alwaysBackdrop?: boolean;
  hideTopThreshold?: number;
}

export function Header({ alwaysBackdrop = false, hideTopThreshold = 0 }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // URLが変わったタイミングで表示状態やスクロール位置をリセットする
  useEffect(() => {
    setIsMobileMenuOpen(false);

    // setTimeout なしだと前ページのスクロール位置が評価される場合があるため、遅延して現在のスクロール位置を反映
    const timer = setTimeout(() => {
      const initialScrollY = window.scrollY;
      const threshold = isHomePage ? 50 : 20;
      setIsScrolled(initialScrollY > threshold);
      setLastScrollY(initialScrollY);

      if (isHomePage && hideTopThreshold > 0 && initialScrollY < hideTopThreshold) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname, isHomePage, hideTopThreshold]);

  useEffect(() => {
    const handleScroll = () => {
      // If mobile menu is open, don't hide the header
      if (isMobileMenuOpen) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      // LP: Trigger slightly before the second section
      // Subpages: Trigger almost immediately (fixed small threshold)
      const hideThreshold = isHomePage ? window.innerHeight - 80 : 50;
      const scrolledTrigger = isHomePage ? 50 : 20;

      // Hide on scroll down, show on scroll up (after a small threshold for visibility toggling)
      let shouldBeVisible = true;

      if (currentScrollY > scrolledTrigger) {
        if (currentScrollY > lastScrollY && currentScrollY > hideThreshold) {
          shouldBeVisible = false;
        } else {
          shouldBeVisible = true;
        }
      } else {
        shouldBeVisible = true;
      }

      if (isHomePage && hideTopThreshold > 0 && currentScrollY < hideTopThreshold) {
        shouldBeVisible = false;
      }

      setIsVisible(shouldBeVisible);
      setIsScrolled(currentScrollY > scrolledTrigger);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobileMenuOpen, isHomePage, hideTopThreshold]);

  const navLinks = [
    { name: "Concept", href: "/#concept" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/#pricing" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
  ];

  const hasBackdrop = alwaysBackdrop || isScrolled;

  return (
    <>
      <header
        className={`fixed bottom-0 md:bottom-auto md:top-0 left-0 w-full md:h-12 z-50 transition-all duration-500 transform ${isVisible ? "translate-y-0" : "translate-y-full md:-translate-y-full"
          } ${hasBackdrop ? "md:bg-black/0 md:backdrop-blur-sm md:shadow-[0_0px_12px_rgba(200,200,200,0.05)] md:border-b md:border-white/5 bg-transparent border-none shadow-none md:fixed md:top-0 md:left-0 md:w-full md:h-12 bg-transparent" : "bg-transparent border-none shadow-none"}`}
      >
        {/* ブラーレイヤー 
          - backdrop-blur で背景をぼかす
          - mask-image で下方向に向けて透明にする
        */}
        <div
          className={`absolute inset-0 -z-10 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-90'
            }`}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            maskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 100%)',
          }}
        />
        <div className="w-full mx-auto pl-6 pr-6 md:pr-0 flex items-center justify-between md:justify-end md:gap-x-12 relative z-120">

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs rounded-full px-5 py-[11px]"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Logo (Hidden on mobile) */}
          <Link href="/" className="hidden md:flex items-center gap-2 relative z-110">
            <Image
              src="/assets/NS_logo_White.jpg"
              alt="Noe Shiftica"
              width={180}
              height={40}
              className="h-7 md:h-8 w-auto opacity-90"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Mobile Nav Toggle - Moved outside header to fix mix-blend-mode stacking context */}
      <div
        className={`md:hidden fixed bottom-5 left-6 z-130 transition-all duration-500 transform ${isVisible ? "translate-y-0" : "translate-y-24"
          } mix-blend-difference`}
      >
        <button
          className="w-12 h-12 flex items-center justify-center border border-white rounded-full bg-white"
          onClick={() => {
            const nextState = !isMobileMenuOpen;
            setIsMobileMenuOpen(nextState);
            if (nextState) setIsVisible(true);
          }}
        >
          {isMobileMenuOpen ? (
            <X size={26} className="text-black" strokeWidth={2.5} />
          ) : (
            <Menu size={26} className="text-black" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay & Content */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[10000]">
            {/* Backdrop: Forced GPU acceleration for reliable filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "linear" }}
              className="absolute inset-0"
              style={{
                backgroundColor: 'rgba(5, 5, 5, 0.75)',
                backdropFilter: 'blur(20px) saturate(180%) brightness(1.1) contrast(1.1)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%) brightness(1.1) contrast(1.1)',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Content Layer: Staggered entry for premium feel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none"
            >
              <div className="w-full max-w-sm flex flex-col items-center space-y-8 pointer-events-auto">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 + 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className="text-3xl font-serif text-white! font-medium tracking-tight transition-all hover:opacity-80 active:scale-95"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
