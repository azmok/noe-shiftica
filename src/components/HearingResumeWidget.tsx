"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useHearingData } from "@/hooks/useHearingData";
import { Trash2, ArrowRight, AlertTriangle, X as CloseIcon } from "lucide-react";

export function HearingResumeWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasData, isCompleted } = useHearingData();
  const [isOpen, setIsOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hide on mobile or if on the hearing page itself
  if (!isMounted || pathname === "/hearing") return null;

  // Only show if there's data to resume
  if (!hasData) return null;

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    localStorage.removeItem("noeShiftica_Hearing_Data");
    setShowResetConfirm(false);
    setIsOpen(false);
    window.location.reload();
  };

  const handleResume = () => {
    router.push(isCompleted ? "/hearing?view=summary" : "/hearing");
    setIsOpen(false);
  };

  return (
    <div className="hidden md:block fixed bottom-6 left-6 z-9999">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-transparent"
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-14 left-0 w-64 bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={handleResume}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium text-white hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E2FF3D]/10 flex items-center justify-center text-[#E2FF3D]">
                    <ArrowRight size={16} />
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {isCompleted ? "内容を確認する" : "回答を再開する"}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">
                      Resume Hearing
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-400/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-400/10">
                    <Trash2 size={16} />
                  </div>
                  <div>
                    <div className="font-semibold">回答をリセット</div>
                    <div className="text-[10px] text-white/20 uppercase tracking-widest">
                      Reset Data
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative ${
          isOpen 
            ? "bg-white text-black" 
            : "bg-[#111111] text-white border border-[oklch(27.4%_0.006_286.033)] shadow-[4px_4px_10px_#0a0a0a,-4px_-4px_10px_#181818]"
        }`}
      >
        <span className="font-serif text-xl font-bold tracking-tighter">N</span>
        {!isOpen && hasData && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#E2FF3D] rounded-full border border-[#111111] shadow-sm" />
        )}
      </motion.button>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-10001 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Decoration background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                  <AlertTriangle size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">
                  回答内容をリセットしますか？
                </h3>
                
                <p className="text-[#8A8A93] leading-relaxed mb-8">
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
                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                aria-label="Close"
              >
                <CloseIcon size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
