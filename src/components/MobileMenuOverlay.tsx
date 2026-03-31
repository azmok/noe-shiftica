"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { useHearingData } from "@/hooks/useHearingData";
import { X as CloseIcon, ArrowRight, Trash2, AlertTriangle } from "lucide-react";

export function MobileMenuOverlay() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const { hasData: hasHearingData, isCompleted } = useHearingData();
  const pathname = usePathname();
  const router = useRouter();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleClose = () => {
    setIsMobileMenuOpen(false);
    setShowResetConfirm(false);
  };

  const confirmReset = () => {
    localStorage.removeItem("noeShiftica_Hearing_Data");
    setShowResetConfirm(false);
    handleClose();
    window.location.reload();
  };

  const handleResume = () => {
    handleClose();
    router.push(isCompleted ? "/hearing?view=summary" : "/hearing");
  };

  const navLinks = [
    { name: "HOME", href: "/", number: "01" },
    { name: "SERVICES", href: "/services", number: "02" },
    { name: "PRICING", href: "/#pricing", number: "03" },
    { name: "ABOUT", href: "/about", number: "04" },
    { name: "BLOG", href: "/blog", number: "05" },
    { name: "CONTACT", href: "/#contact", number: "06" },
  ];

  const inHearing = pathname?.startsWith("/hearing") || false;

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-10000 flex flex-col">
          {/* Backdrop Blur Map */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#08080A]/90 backdrop-blur-2xl"
            onClick={handleClose}
          />

          {/* Main Menu Wrapper */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 pt-24 pb-32 px-8 sm:px-12 overflow-y-auto custom-scrollbar pointer-events-none flex flex-col min-h-dvh"
          >
            <div className="w-full max-w-lg space-y-7 pointer-events-auto mt-auto mb-auto">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.4, ease: "easeOut" }}
                >
                  <Link
                    href={link.href}
                    className="flex items-end gap-5 group w-fit"
                    onClick={handleClose}
                  >
                    <span className="text-sm font-bold text-[#E2FF3D] mb-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      {link.number}
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-wider group-hover:text-[#E2FF3D] transition-colors duration-300">
                      {link.name}
                    </h2>
                  </Link>
                </motion.div>
              ))}

              {/* Bottom Widget for Resume/Reset (Only outside /hearing) */}
              {!inHearing && hasHearingData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="mt-12 pt-8 border-t border-white/10"
                >
                  <div className="bg-[#121216]/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col gap-1 w-full sm:max-w-xs shadow-xl">
                    <button
                      onClick={handleResume}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left text-sm font-medium text-white hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#E2FF3D]/10 flex items-center justify-center text-[#E2FF3D] group-hover:bg-[#E2FF3D] group-hover:text-black transition-colors">
                        <ArrowRight size={18} />
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {isCompleted ? "内容を確認する" : "回答を再開する"}
                        </div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest leading-tight">
                          Resume Hearing
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-400/20 transition-colors pointer-events-none">
                        <Trash2 size={18} />
                      </div>
                      <div>
                        <div className="font-semibold transition-colors">回答をリセット</div>
                        <div className="text-[10px] text-white/20 uppercase tracking-widest leading-tight">
                          Reset Data
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Close Button Bottom Left */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            onClick={handleClose}
            className="absolute bottom-8 left-8 w-14 h-14 rounded-full bg-[#121216] border border-white/20 flex items-center justify-center text-white hover:bg-[#E2FF3D] hover:text-black hover:scale-110 active:scale-95 transition-all z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer pointer-events-auto"
          >
            <CloseIcon size={24} strokeWidth={2} />
          </motion.button>

          {/* Reset Confirmation Modal */}
          <AnimatePresence>
            {showResetConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10001 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md pointer-events-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                      <AlertTriangle size={28} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3">
                      回答内容をリセットしますか？
                    </h3>

                    <p className="text-[#8A8A93] text-sm leading-relaxed mb-8">
                      これまでの回答データがすべて削除され、最初からやり直すことになります。この操作は取り消せません。
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 px-6 py-4 rounded-xl text-sm font-semibold text-white bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={confirmReset}
                        className="flex-1 px-6 py-4 rounded-xl text-sm font-semibold text-[#08080A] bg-white hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-[0_8px_16px_rgba(255,255,255,0.1)]"
                      >
                        リセットする
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="absolute top-5 right-5 p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <CloseIcon size={20} />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
