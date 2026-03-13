"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronLeft } from "lucide-react";
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
  const isBlogDetail = pathname?.startsWith("/blog/") && pathname !== "/blog";
  const isBlogPage = pathname?.startsWith("/blog");

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
        className={`fixed transition-all duration-500 transform ${isBlogPage ? "top-0 left-0 w-full h-16 md:h-12 z-50" : "top-0 left-0 w-full md:h-12 z-50"
          } ${isVisible ? "translate-y-0" : isBlogPage ? "-translate-y-full" : "-translate-y-full"} ${hasBackdrop || isBlogPage ? "bg-white md:bg-transparent shadow-sm md:shadow-none" : "bg-transparent"
          }`}
      >
        {/* ブラーレイヤー (Hidden on mobile blog page for clean sample look, shown on desktop for all pages) */}
        <div
          className={`absolute inset-0 -z-10 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-90'
            } ${isBlogPage ? 'hidden md:block' : ''}`}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          }}
        />

        <div className={`w-full h-full mx-auto flex items-center justify-between md:justify-end md:gap-x-12 relative z-120`}>

          {/* Mobile Back Button (Detail Page only) */}
          {isBlogPage && (
            <div className="md:hidden flex-1">
              {isBlogDetail && (
                <Link
                  href="/blog"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-(--mobile-surface) shadow-(--mobile-shadow-soft) text-(--mobile-text-primary)"
                >
                  <ChevronLeft size={24} />
                </Link>
              )}
            </div>
          )}

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

          {/* Logo */}
          <div className={`hidden md:flex items-center ${isBlogPage ? "md:flex-initial" : "md:flex-initial"} justify-end`}>
            <Link href="/" className="flex items-center gap-2 relative z-110">
              <Image
                src={isBlogPage ? "/assets/NS_logo_Black.jpg" : "/assets/NS_logo_White.jpg"}
                alt="Noe Shiftica"
                width={45}
                height={26}
                className={`${isBlogPage ? "h-6 md:h-8" : "block h-6 md:h-8"} w-auto opacity-90`}
                priority
              />
            </Link>
          </div>

          {/* Spacer for centering on mobile blog page if back button exists */}
          {isBlogPage && <div className="md:hidden flex-1 flex ml-auto justify-end">
            {/* Future right side icons if any */}
          </div>}
        </div>
      </header>

      {/* Mobile Menu Overlay & Content */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-10000">
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
