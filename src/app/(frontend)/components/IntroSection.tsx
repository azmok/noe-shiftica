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
          className="text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
        >
          AIと最新技術を武器に、あなたのビジネスに必要な「見た目」と「体験」を設計します。
          <br className="hidden md:block" />
          テンプレートではなく、あなただけの世界観を。最短1週間、15万円〜。
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
          <Button href="#works" variant="outline" size="lg" className="w-full sm:w-auto">
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
      </div>
    </section>
  );
}
