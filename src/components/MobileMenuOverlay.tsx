"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { useHearingData } from "@/hooks/useHearingData";

export function MobileMenuOverlay() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const { hasData: hasHearingData, isCompleted } = useHearingData();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Pricing", href: "/#pricing" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/#contact" },
  ];

  return (
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
              
              {hasHearingData && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.04 + 0.1 }}
                  className="mt-8"
                >
                  <Link
                    href={isCompleted ? "/hearing?view=summary" : "/hearing"}
                    className="text-sm font-medium text-[#E2FF3D] transition-all hover:opacity-80 active:scale-95"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {isCompleted ? "ヒアリングシートを確認する" : "ヒアリングシートの続きを入力する"}
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
