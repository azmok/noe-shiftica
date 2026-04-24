"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Button } from "./ui/Button";

interface PricingSectionProps {
  fadeIn: Variants;
  onPlanSelect?: (budget: string) => void;
}

export function PricingSection({ fadeIn, onPlanSelect }: PricingSectionProps) {
  const budgetMapping: Record<string, string> = {
    Lite: "15",
    Standard: "35",
    Premium: "unknown",
  };

  return (
    <section id="pricing" className="py-32 px-6 relative z-10">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-[5.5rem] font-serif font-bold mb-4 heading-2 oxanium-heading">
            Pricing
          </h2>
          <p className="text-xl text-[#b8b8b8] mb-6">
            明確な価格。隠れた費用なし。
          </p>
          <p className="section-desc-2 text-[1rem] text-[#919090] leading-relaxed font-light">
            必要な費用は、何のために・誰に・いくらかかるかを必ず事前に説明します。
            <br />
            不要な管理費や意味不明な月額請求は一切ありません。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              name: "Lite",
              price: "¥150,000〜",
              desc: "LP・ポートフォリオ\nスピード重視パッケージ",
              time: "納期：約1〜2週間",
            },
            {
              name: "Standard",
              price: "¥350,000〜",
              desc: "コーポレートサイト\nCMS(ブログ等)導入",
              time: "納期：約3〜4週間",
            },
            {
              name: "Premium",
              price: "要相談",
              desc: "多機能・システム連携\nAI運用自動化フルパック",
              time: "納期：要相談",
            },
          ].map((plan, idx) => (
            <motion.div
              key={idx}
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="p-8 rounded-3xl border border-white/10 bg-[#111111]/30 relative flex flex-col h-full"
            >
              <h3 className="text-2xl !font-inconsolata font-bold mb-2">
                {plan.name}
              </h3>
              <div className="mb-6 pb-6 border-b border-white/10">
                <span className="text-4xl font-bold !font-inconsolata text-[#FFFFFF]">
                  {plan.price}
                </span>
              </div>
              <p className="text-white/80 whitespace-pre-line mb-6 flex-grow">
                {plan.desc}
              </p>
              <div className="mt-auto pt-10">
                <p className="text-xs text-white/60">{plan.time}</p>
                <Button
                  href="#contact"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    onPlanSelect?.(budgetMapping[plan.name]);

                    // 確実にスクロールさせるための処理（Linkのデフォルト動作をキャンセルして手動実行）
                    setTimeout(() => {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                      // URLハッシュも念のため更新
                      window.history.pushState(null, '', '#contact');
                    }, 50);
                  }}
                >
                  選択する
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-3xl mx-auto bg-[#111111]/50 border border-white/10 p-8 rounded-2xl"
        >
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-[#FFFFFF]">●</span> 保守費用について
          </h4>
          <p className="text-white/80 text-xs leading-relaxed">
            (オプション)<br />
            月額保守：¥5,000〜¥10,000 /
            月（サーバー維持・軽微な修正・運用サポート込）
          </p>

        </motion.div>
      </div>
    </section>
  );
}
