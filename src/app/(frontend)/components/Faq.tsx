"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, MousePointer2 } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "対応エリアはどこですか？出張や訪問は可能ですか？",
    answer: "Noe Shifticaはフルリモート専門のスタジオです。東京・渋谷にオフィスを構えていますが、打ち合わせはすべてオンライン（Zoom / Google Meet）で完結します。ご訪問・出張対応は行っていませんが、オンラインで全国どこからでもご相談いただけます。",
  },
  {
    question: "AIの導入支援も相談できますか？",
    answer: "はい、お任せください。Web制作はもちろん、GeminiやClaudeなどの生成AIを業務に取り入れるご支援も行っています。「AIって何から始めればいいの？」という段階からでも、一緒に考えます。",
  },
  {
    question: "Next.js / Reactって、普通のサイトと何が違うの？",
    answer: "一言で言うと「表示が速くて、壊れにくい」サイトが作れます。速さはそのままSEOの評価にも直結するので、検索で見つけてもらいやすくなります。将来的な機能追加にも強い構成でお届けします。",
  },
  {
    question: "納品後に自分でコンテンツを更新できますか？",
    answer: "はい、管理画面から簡単に更新できる仕組みを標準で導入しています。ブログ記事の追加や文章の修正なら、専門知識ゼロでOKです。月額保守プランでは、セキュリティ更新や細かな修正もまとめてお任せいただけます。",
  },
];

export function Faq() {
  const [activeIndices, setActiveIndices] = useState<number[]>([]);

  const toggleAccordion = (index: number) => {
    setActiveIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section id="faq" className="py-32 px-6 relative z-10">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative text-center mb-20"
        >
          <h2 className="text-4xl md:text-[5.5rem] font-serif font-bold mb-4 heading-2 oxanium-heading">
            FAQ.
          </h2>
          <p className="text-xl text-white/80">
            よくあるご質問
          </p>

          {/* Interactive Hint - Cool & Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="hidden md:flex absolute -bottom-10 left-1/2 -translate-x-1/2 items-center gap-3 text-[10px] tracking-[0.3em] text-white/40 uppercase font-light"
          >
            <motion.div
              animate={{
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <MousePointer2 className="w-3 h-3 rotate-12" />
            </motion.div>
            <span>Tap to explore</span>
          </motion.div>
        </motion.div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = activeIndices.includes(idx);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{
                  delay: idx * 0.1,
                  duration: 0.5,
                  ease: [0.23, 1, 0.32, 1]
                }}
                className="relative group border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm"
              >
                {/* Subtle Hover Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
                />

                <button
                  onClick={() => toggleAccordion(idx)}
                  className="relative w-full flex items-center justify-between p-6 md:p-8 text-left transition-colors no-custom-cursor"
                  aria-expanded={isOpen}
                >
                  <span className="text-[1rem] md:text-[1.05rem] tracking-[0.09em] font-medium pr-8">
                    {item.question}
                  </span>
                  <motion.span
                    className="shrink-0"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isOpen ? (
                      <Minus className="w-5 h-5 opacity-60" />
                    ) : (
                      <Plus className="w-5 h-5 opacity-60" />
                    )}
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.04, 0.62, 0.23, 0.98]
                      }}
                      className="overflow-hidden"
                    >
                      <div className="text-sm font-extralight tracking-[0.01em] px-6 pb-8 md:px-8 md:pb-10 pt-0 text-white/70 leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
