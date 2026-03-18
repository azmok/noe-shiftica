"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "オンライン全国対応（Zoom/Meet等）は可能ですか？",
    answer: "はい、もちろんです。滋賀県を拠点としておりますが、オンライン（Zoom / Google Meet等）でのご相談・お打ち合わせにより、全国のプロジェクトに対応可能です。お気軽にご相談ください。",
  },
  {
    question: "生成 AI（Gemini/Claude等）の導入支援も行っていますか？",
    answer: "Web制作だけでなく、業務へのAI活用やプロンプトエンジニアリングの導入支援も行っています。非効率な業務をAIで自動化し、クリエイティブな時間を最大化するための設計をご提案します。",
  },
  {
    question: "Next.js/React による高速サイト制作のメリットは何ですか？",
    answer: "従来のサイトと比較して圧倒的な表示速度を実現し、SEO評価の向上、そしてユーザーの離脱防止に直結します。将来的な拡張性も高く、モダンで堅牢なサイトを構築できます。",
  },
  {
    question: "東近江市拠点の地方 DX 支援とは具体的にどのような内容ですか？",
    answer: "滋賀県東近江市の地域課題に寄り添い、アナログな業務プロセスのデジタル化を支援します。単なるツール導入ではなく、現場の使いやすさを重視した設計で、持続可能な変化（Shift）を共に作り上げます。",
  },
  {
    question: "PayloadCMS による運用保守はどのようなサポートですか？",
    answer: "管理画面から直接コンテンツを更新できる Payload CMS を導入することで、公開後の情報発信をスムーズにします。月額保守プランでは、サーバー維持、セキュリティ更新、軽微な修正等、安心して運用いただける体制を提供します。",
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
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-[5.5rem] font-serif font-bold mb-4 heading-2 oxanium-heading">
            FAQ.
          </h2>
          <p className="text-xl text-white/80">
            よくあるご質問
          </p>
        </motion.div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = activeIndices.includes(idx);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left transition-colors no-custom-cursor"
                  aria-expanded={isOpen}
                >
                  <span className="text-[1rem] md:text-[1.1rem] tracking-[0.09em] font-medium pr-8">
                    {item.question}
                  </span>
                  <span className="shrink-0">
                    {isOpen ? (
                      <Minus className="w-5 h-5 opacity-60" />
                    ) : (
                      <Plus className="w-5 h-5 opacity-60" />
                    )}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
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
