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
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 transform ${isVisible ? "translate-y-0" : "-translate-y-full"
        } ${hasBackdrop ? "md:bg-black/0 md:backdrop-blur-sm md:shadow-[0_0px_12px_rgba(200,200,200,0.05)] md:border-b md:border-white/5 bg-transparent border-none shadow-none" : "bg-transparent border-none shadow-none"}`}
    >
      <div className={`w-full mx-auto pl-6 pr-6 md:pr-0 flex items-center justify-between md:justify-end md:gap-x-12 transition-all duration-500 relative z-120 ${hasBackdrop ? "" : "bg-transparent"}`}>

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
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="isolate fixed inset-0 h-dvh w-screen bg-transparent z-110 flex flex-col items-center justify-center"
          >
            {/* 背景ボカシ専用のレイヤー */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 0,
              }}
            />
            <div className="relative z-10 p-10 rounded-3xl flex flex-col items-center space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-2xl font-serif text-white rounded-full transition-colors hover:text-primary"
                  style={{ padding: '0.2em 0.5em' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating Mobile Nav Toggle (Bottom Left, Fixed) - Moved outside header for correct coordinate system */}
      <button
        className={`md:hidden fixed bottom-8 left-8 z-130 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${isMobileMenuOpen
            ? "bg-white text-black scale-100 rotate-0"
            : `bg-black/80 backdrop-blur-md text-white border border-white/10 ${isScrolled ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-90"}`
          }`}
        onClick={() => {
          const nextState = !isMobileMenuOpen;
          setIsMobileMenuOpen(nextState);
        }}
      >
        {isMobileMenuOpen ? (
          <X size={26} />
        ) : (
          <Menu size={26} />
        )}
      </button>
    </header>
  );
}
