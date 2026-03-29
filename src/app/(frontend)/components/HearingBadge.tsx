"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { Trash2, FileText, X } from "lucide-react";

export function HearingBadge() {
  const [hasData, setHasData] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = 'noeShiftica_Hearing_Data';

  const checkData = () => {
    try {
      const itemStr = localStorage.getItem(STORAGE_KEY);
      if (itemStr) {
        const item = JSON.parse(itemStr);
        // 有効期限内かチェック (7日間)
        if (Date.now() - item.timestamp <= 7 * 24 * 60 * 60 * 1000) {
          setHasData(true);
          return;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {}
    setHasData(false);
  };

  useEffect(() => {
    checkData();
    // 他のタブやページ遷移での変更を検知
    window.addEventListener('storage', checkData);
    return () => window.removeEventListener('storage', checkData);
  }, [pathname]);

  // メニューの外側をクリックしたら閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!hasData) return null;

  const handleDelete = () => {
    if (confirm("ヒアリング内容を削除してよろしいですか？")) {
      localStorage.removeItem(STORAGE_KEY);
      setHasData(false);
      setIsOpen(false);
      // 送信前ならリロード等で追従させるためのトリガー
      window.dispatchEvent(new Event('storage'));
    }
  };

  const navigateToHearing = () => {
    router.push('/hearing');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9998] flex flex-col items-start translate-y-0" style={{ pointerEvents: 'auto' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: 10, originX: 0, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mb-3 bg-[#121216] border border-white/10 rounded-2xl p-2 shadow-2xl min-w-[220px] backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={navigateToHearing}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E2FF3D]/10 flex items-center justify-center group-hover:bg-[#E2FF3D]/20 transition-colors">
                  <FileText size={16} className="text-[#E2FF3D]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">フォームを再確認する</span>
                  <span className="text-[10px] text-white/40">前回の回答から再開します</span>
                </div>
              </button>

              <div className="h-px bg-white/5 mx-2 my-1" />

              <button
                onClick={handleDelete}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Trash2 size={16} className="text-red-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-red-400">この結果を削除する</span>
                  <span className="text-[10px] text-red-400/50">保存データをクリアします</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[#08080A] border ${isOpen ? 'border-[#E2FF3D] shadow-[0_0_15px_rgba(226,255,61,0.3)]' : 'border-white/20 shadow-xl'}`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={20} className="text-[#E2FF3D]" />
            </motion.div>
          ) : (
            <motion.div
              key="badge"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-white font-bold text-lg select-none"
            >
              N
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
