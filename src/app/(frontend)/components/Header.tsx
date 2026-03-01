"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/Button";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide on scroll down, show on scroll up (after 50px threshold)
      if (currentScrollY > 50) {
        if (currentScrollY > lastScrollY) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setIsScrolled(currentScrollY > 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { name: "Concept", href: "/#concept" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/#pricing" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-transparent transition-all duration-300 transform ${isVisible ? "translate-y-0" : "md:-translate-y-full"
        }`}
    >
      <div className={`w-full mx-auto pl-6 pr-6 md:pr-0 flex items-center justify-end md:gap-x-12 bg-white/5 backdrop-blur-[5px] transition-all duration-300`}>


        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs font-medium text-white/80 rounded-full"
              style={{ padding: '0.5em 1em' }}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Logo (Hidden on mobile) */}
        <Link href="/" className="hidden md:flex items-center gap-2 relative z-[110]">
          <Image
            src="/assets/NS_logo_White.jpg"
            alt="Noe Shiftica"
            width={180}
            height={40}
            className="h-7 md:h-8 w-auto opacity-90"
            priority
          />
        </Link>

        {/* Mobile Nav Toggle */}
        <button
          className="md:hidden relative z-[110] text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 h-[100dvh] w-screen bg-transparent backdrop-blur-md z-[100] flex flex-col items-center justify-center space-y-8"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-2xl font-serif text-white rounded-full"
                style={{ padding: '0.5em 1em' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
