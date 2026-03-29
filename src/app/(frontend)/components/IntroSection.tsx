"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Button } from "./ui/Button";

interface IntroSectionProps {
  fadeIn: Variants;
}

export function IntroSection({ fadeIn }: IntroSectionProps) {
  return (
    <section className="relative pt-20 pb-32 px-6 z-10">
      <div className="container mx-auto max-w-6xl flex flex-col items-center text-center">
        <motion.p
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeIn}
          className="text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light text-center"
        >
          AIと最新技術で、
          Webサイトとデジタル体験を設計する。<br />
          あなたのビジネスに必要な「見た目」と「体験」をつくります。
          <span className="block mt-4 text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light text-center">
            テンプレートではなく、あなただけの世界観を。最短1週間、15万円〜。
          </span>
        </motion.p>
        <motion.div
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeIn}
          className="flex flex-col sm:flex-row gap-5 sm:gap-6 w-full sm:w-auto items-center mt-2 mb-4"
        >
          <Button href="#contact" variant="primary" size="lg" className="w-full sm:w-auto">
            無料相談を予約する
          </Button>
          <Button href="/services#works" variant="outline" size="lg" className="w-full sm:w-auto">
            実績を見る ↓
          </Button>
        </motion.div>
        <motion.p
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeIn}
          className="mt-6 text-xs text-white/50"
        >
          返信は24時間以内 ・ 相談無料 ・ 押し売りなし
        </motion.p>

        {/* Tech Stack & Cloud Technology Sections */}
        <div className="mt-28 grid grid-cols-1 md:grid-cols-2 gap-16 w-full max-w-4xl mx-auto text-left border-t border-white/5 pt-16">
          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h3 className="text-primary font-serif text-xl mb-8 flex items-center gap-3 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Tech Stack
            </h3>
            <ul className="space-y-5">
              {[
                { name: "Next.js", dev: "Framework" },
                { name: "Payload CMS", dev: "Headless CMS" },
                { name: "Tailwind CSS", dev: "Styling" },
                { name: "Cloud AI (Gemini)", dev: "AI Engine" }
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-end border-b border-white/5 pb-2 group">
                  <span className="text-white/80 font-medium tracking-tight group-hover:text-white transition-colors">{item.name}</span>
                  <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-light mb-1">{item.dev}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            custom={5}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h3 className="text-primary font-serif text-xl mb-8 flex items-center gap-3 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Cloud Technology
            </h3>
            <ul className="space-y-5">
              {[
                { name: "Firebase App Hosting", dev: "Hosting" },
                { name: "Firebase Cloud Storage", dev: "Media" },
                { name: "Neon", dev: "Database" }
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-end border-b border-white/5 pb-2 group">
                  <span className="text-white/80 font-medium tracking-tight group-hover:text-white transition-colors">{item.name}</span>
                  <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-light mb-1">{item.dev}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
