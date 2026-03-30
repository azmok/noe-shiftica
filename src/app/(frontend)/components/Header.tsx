"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronLeft } from "lucide-react";
import { Button } from "./ui/Button";
import { useMobileMenu } from "@/context/MobileMenuContext";

interface HeaderProps {
  alwaysBackdrop?: boolean;
  hideTopThreshold?: number;
}

export function Header({ alwaysBackdrop = false, hideTopThreshold = 0 }: HeaderProps) {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isBlogDetail = pathname?.startsWith("/blog/") && pathname !== "/blog";
  const isBlogPage = pathname?.startsWith("/blog");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debug log for production visibility
  useEffect(() => {
    if (isMounted) {
      console.log("[Header] isBlogPage:", isBlogPage, "pathname:", pathname);
    }
  }, [isMounted, isBlogPage, pathname]);

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
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Pricing", href: "/#pricing" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/#contact" },
  ];

  const hasBackdrop = alwaysBackdrop || isScrolled;

  // Hydration safety: use a default src during SSR and switch after mount if needed
  const logoSrc = isMounted && isBlogPage ? "/assets/NS_logo_Black.png" : "/assets/NS_logo_White.jpg";

  return (
    <>
      <header
        className={`fixed transition-all duration-500 transform top-0 left-0 w-full h-16 md:h-12 z-50 hidden md:block ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        } ${
          "bg-transparent"
        }`}
      >
        {/* ブラーレイヤー */}
        <div
          className={`absolute inset-0 -z-10 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundColor: isBlogPage ? 'rgba(255, 255, 255, 0.05)' : 'rgba(5, 5, 5, 0.1)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          }}
        />

        <div className={`w-full h-full mx-auto flex items-center justify-between md:justify-end md:gap-x-12 px-6 md:px-0 relative z-120`}>

          {/* Mobile Back Button (Blog detail page only) */}
          {isBlogDetail && (
            <div className="md:hidden flex-1">
              <Link
                href="/blog"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-(--mobile-surface) shadow-(--mobile-shadow-soft) text-(--mobile-text-primary)"
              >
                <ChevronLeft size={24} />
              </Link>
            </div>
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 md:order-1">
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

          {/* Logo (Mobile & Desktop) */}
          <div className="flex items-center justify-between w-full md:w-auto md:order-2">
            <Link href="/" className="flex items-center gap-2 relative z-110">
              <Image
                src={logoSrc}
                alt="Noe Shiftica"
                width={32}
                height={32}
                className="block h-6 md:h-8 w-auto max-h-full object-contain opacity-90"
                priority
                style={{ height: '32px', width: 'auto' }}
              />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
