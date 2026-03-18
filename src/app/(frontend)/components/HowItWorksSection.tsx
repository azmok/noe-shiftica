"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

interface HowItWorksSectionProps {
  fadeIn: Variants;
}

export function HowItWorksSection({ fadeIn }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="py-32 px-6 relative z-10">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-[5.5rem] font-serif font-bold mb-4 heading-2 oxanium-heading">
            How it Works.
          </h2>
          <p className="text-xl text-[#b8b8b8]">
            最短1週間で公開まで。迷いを潰す5ステップ。
          </p>
        </motion.div>

        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-[#FFFFFF]/30 before:to-transparent">
          {[
            {
              step: "01",
              phase: "Hearing",
              desc: "ヒアリングシートへの記入と、15〜30分のDiscovery Call（任意）。目的・ターゲット・参考サイトを確認し、迷いどころを最初に潰します。",
            },
            {
              step: "02",
              phase: "Design",
              desc: "方向性を1本に絞り、Awwwards水準のデザインに仕上げます。テンプレートは使いません。",
            },
            {
              step: "03",
              phase: "Build",
              desc: "Next.js × Payload CMS × Postgresで実装。表示速度・SEO・運用性をすべて両立した構成で構築します。",
            },
            {
              step: "04",
              phase: "QA Check",
              desc: "Claude.aiによる自動品質チェック。セキュリティ・バグ・抜け漏れをAIが二重確認します。",
            },
            {
              step: "05",
              phase: "Launch",
              desc: "公開。その後も月5,000〜10,000円の保守プランで継続サポートします。",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeIn}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#FFFFFF] bg-[#050505] text-[#FFFFFF] font-mono text-[1rem] font-bold z-10 shrink-0 md:order-1 md:group-odd:-ml-[20px] md:group-even:-mr-[20px] shadow-[0_0_10px_rgba(204,221,0,0.5)]">
                {item.step}
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-[#111111]/30 border border-white/10 hover:bg-[#111111]/60 transition-colors">
                <h3 className="text-[1.625rem] font-bold mb-2 text-[#bdbdbd]">
                  {item.phase}
                </h3>
                <p className="section-desc-2 text-[1rem] text-[#919090] leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-white/50 text-xs mt-12">
          ※ ヒアリング完了・素材提出・着手金入金が揃った時点を Day 1
          とします。素材の準備状況によって納期が前後する場合があります。
        </p>
      </div>
    </section>
  );
}
