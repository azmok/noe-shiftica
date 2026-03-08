"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/Button";
import Head from "next/head";

export default function AboutPage() {
  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    }),
  };

  return (
    <div className="min-h-screen text-white relative selection:bg-[#FFFFFF] selection:text-background-void">
      <Header />

      {/* 1. Hero Section */}
      <section className="pt-48 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-4"
          >
            About Noe Shiftica.
          </motion.h1>
          <motion.h2
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-xl md:text-2xl text-[#FFFFFF] font-sans mb-12"
          >
            本質を設計する、AI×デザインスタジオ。
          </motion.h2>
        </div>
      </section>

      {/* 2. Philosophy Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16"
          >
            <h3 className="text-3xl font-serif font-bold mb-6 text-white border-b border-white/20 pb-4 inline-block">
              Noe Shifticaとは何か
            </h3>
            <p className="text-white/80 leading-relaxed mb-6">
              「Noe」はギリシャ語のNoesis（ノエシス）に由来します。直観的知性、つまり表層ではなく本質を掴む認識力のことです。
            </p>
            <p className="text-white/80 leading-relaxed mb-6">
              「Shiftica」はShift（変化・転換）とラテン語的語尾の-ica（体系・美学）を組み合わせた造語です。変化を設計する体系、美しく転換させる知的構造を意味します。
            </p>
            <div className="p-8 bg-[#111111]/30 border border-[#FFFFFF]/30 rounded-2xl my-8">
              <p className="text-xl font-serif leading-relaxed text-[#FFFFFF]">
                デザインとは表面を整えることではない。
                <br />
                ブランドの核心を見抜き（Noe）、それを美しい形に転換する（Shiftica）こと。
                <br />
                それがNoe Shifticaの仕事です。
              </p>
            </div>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16"
          >
            <h3 className="text-3xl font-serif font-bold mb-6 text-white border-b border-white/20 pb-4 inline-block">
              なぜ作るのか
            </h3>
            <p className="text-white/80 leading-relaxed mb-6">
              「稼ぎたい」と「楽しく生きたい」は、本来矛盾しない。
              <br />
              しかし多くのビジネスで、ブランドの見せ方がその両立を妨げています。予算がなくてテンプレートを使う。クオリティを上げようとすると高額になる。どちらを選んでも、WantToを諦めることになる。
            </p>
            <p className="text-white/80 leading-relaxed mb-6">
              Noe ShifticaはAIと最新技術を使って、その構造を壊します。
              <br />
              目指しているのは、「自分の思うように生きたい」という意志を持つ人が、世界と正面から向き合えるブランドを手に入れること。デザインはそのための道具です。
            </p>
          </motion.div>

          <motion.div
            custom={5}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16"
          >
            <h3 className="text-3xl font-serif font-bold mb-6 text-white border-b border-white/20 pb-4 inline-block">
              やらないこと、やること
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-2xl">
                <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2">
                  <span className="text-2xl">×</span> やらないこと
                </h4>
                <ul className="space-y-3 text-white/70 text-xs">
                  <li>・不要な月額費用を請求しない</li>
                  <li>・中身の分からない管理費を取らない</li>
                  <li>・何もしていないのに発生する請求をしない</li>
                </ul>
              </div>
              <div className="bg-[#FFFFFF]/10 border border-[#FFFFFF]/30 p-6 rounded-2xl">
                <h4 className="font-bold text-[#FFFFFF] mb-4 flex items-center gap-2">
                  <span className="text-2xl">○</span> やること
                </h4>
                <ul className="space-y-3 text-white/70 text-xs">
                  <li>
                    ・必要な費用は「何のために・誰に・いくらかかるか」を必ず事前に説明する
                  </li>
                  <li>
                    ・分からない点はいつでも質問を受け付け、納得してから進める
                  </li>
                  <li>・クライアントの利益を最優先に、最適な提案をする</li>
                </ul>
              </div>
            </div>
            <p className="mt-6 text-center text-white/90 font-bold">
              費用の透明性は、信頼の最低条件だと思っています。
            </p>
          </motion.div>

          <motion.div
            custom={6}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16"
          >
            <h3 className="text-3xl font-serif font-bold mb-6 text-white border-b border-white/20 pb-4 inline-block">
              どうやって作るのか
            </h3>
            <p className="text-white/80 leading-relaxed mb-6">
              Noe Shifticaは、1人のスタジオです。
              <br />
              AIツール（Claude.ai、Midjourney等）を制作ワークフローに統合することで、従来チームが担っていた作業量をひとりで処理します。削減されたコストは、デザインの質とスピードに再投資します。
            </p>
            <div className="space-y-6 my-8">
              <div className="bg-[#111111]/40 p-6 rounded-xl border border-white/10">
                <h4 className="text-[#FFFFFF] font-mono font-bold mb-2">
                  Frontend：Next.js（App Router）
                </h4>
                <p className="text-white/70 text-xs">高速・SEO・拡張性</p>
              </div>
              <div className="bg-[#111111]/40 p-6 rounded-xl border border-white/10">
                <h4 className="text-[#FFFFFF] font-mono font-bold mb-2">
                  CMS：Payload CMS
                </h4>
                <p className="text-white/70 text-xs">
                  直感的な管理画面。更新を自分でできる
                </p>
              </div>
              <div className="bg-[#111111]/40 p-6 rounded-xl border border-white/10">
                <h4 className="text-[#FFFFFF] font-mono font-bold mb-2">
                  Database：Neon（Serverless Postgres）
                </h4>
                <p className="text-white/70 text-xs">
                  小さく始めて大きく育てられる
                </p>
              </div>
              <div className="bg-[#111111]/40 p-6 rounded-xl border border-white/10">
                <h4 className="text-[#FFFFFF] font-mono font-bold mb-2">
                  QA：Claude.ai
                </h4>
                <p className="text-white/70 text-xs">
                  セキュリティ・バグを自動チェック
                </p>
              </div>
            </div>
            <p className="text-center text-xl font-serif text-[#FFFFFF] font-bold mt-10">
              「AIで速く、人間で美しく。」これが、Noe Shifticaの制作原則です。
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. CTA Section */}
      <section className="py-24 px-6 relative z-10 border-t border-white/10 bg-linear-to-b from-transparent to-background-void">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Ready to Shift?
            </h2>
            <p className="text-xl text-white/80 mb-10">
              一緒に、あなたのブランドを設計しましょう。
            </p>
            <Button href="/#contact" variant="primary" size="lg">
              お問い合わせ・無料相談はこちら
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
