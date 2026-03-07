"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Button } from "./components/ui/Button";
import clsx from "clsx";
import { PastelTopology } from "./components/PastelTopology";

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fade In variants
  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] as any },
    }),
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative selection:bg-[#FFFFFF] selection:text-[#050505]">
      <div
        className="fixed inset-0 w-full h-full opacity-[0.07] pointer-events-none z-20"
        style={{ background: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      />
      <Header />

      {/* 1. Hero Section */}
      <section className="relative h-screen flex flex-col justify-center items-center text-center px-6">
        <PastelTopology />
        <motion.div
          style={{ y: yHero }}
          className="z-10 hero-container w-full"
        >
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="hero-h1 heading-1 oxanium-heading text-right"
          >
            Design the Shift.
          </motion.h1>
          <motion.h2
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="hero-h2 heading-2 text-right"
          >
            本質を設計する。世界観を転換する。
          </motion.h2>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
        </motion.div>
      </section>

      {/* 1.5. Intro Section */}
      <section className="relative pt-20 pb-32 px-6 z-10">
        <div className="container mx-auto max-w-6xl flex flex-col items-center text-center">
          <motion.p
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
            className="text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed"
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
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <Button href="#contact" variant="primary" size="lg">
              無料相談を予約する
            </Button>
            <Button href="#works" variant="outline" size="lg">
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

      {/* 2. Concept Section */}
      <section id="concept" className="py-32 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="mb-20 text-center md:text-left max-w-3xl"
          >
            <h2 className="text-4xl md:text-[5.5rem] font-serif font-light mb-6 heading-2 oxanium-heading">
              AI × Design.
              <br />
              <span className="text-xl md:text-2xl font-sans text-[#FFFFFF] block mt-4 font-normal">
                制作コストを削減して、その分を「質」に全振りする。
              </span>
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              従来のWeb制作は、品質を上げれば費用がかかり、費用を抑えればテンプレートになる。
              <br />
              Noe
              Shifticaは、AIワークフローで制作の非効率を削ぎ落とし、本来なら50万〜数百万円かかるレベルのデザイン体験を、15万円〜で提供します。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "AIで速く、人間で美しく",
                desc: "コーディングの反復作業はAIが担い、デザインの感性と判断は人間が担う。速さと品質を同時に実現する構造です。",
              },
              {
                title: "本質から設計する",
                desc: "見た目を整えるのではなく、ブランドの核心から再設計します。Noesis（本質を掴む知性）× Shift（変化の設計）— それがNoe Shifticaの思想です。",
              },
              {
                title: "最新技術で、育つサイトを",
                desc: "Next.js / Payload CMS / Neonによる構成で、公開後も成長できるサイトを作ります。テンプレートでは作れない、拡張性と速度を両立した設計です。",
              },
            ].map((pillar, idx) => (
              <motion.div
                key={idx}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeIn}
                className="bg-[#111111]/40 border border-[#888888]/20 p-8 rounded-2xl hover:border-[#FFFFFF]/50 transition-colors group"
              >
                <div className="text-4xl font-serif text-[#FFFFFF] mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                  0{idx + 1}
                </div>
                <h3 className="text-xl font-bold mb-4">{pillar.title}</h3>
                <p className="text-white/70 text-xs leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How it Works Section */}
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
            <p className="text-xl text-[#FFFFFF]">
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
                desc: "Next.js × Payload CMS × Neonで実装。表示速度・SEO・運用性をすべて両立した構成で構築します。",
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
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#FFFFFF] bg-[#050505] text-[#FFFFFF] font-mono text-xs font-bold z-10 shrink-0 md:order-1 md:group-odd:-ml-[20px] md:group-even:-mr-[20px] shadow-[0_0_10px_rgba(204,221,0,0.5)]">
                  {item.step}
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-[#111111]/30 border border-white/10 hover:bg-[#111111]/60 transition-colors">
                  <h3 className="text-xl font-bold mb-2 text-white">
                    {item.phase}
                  </h3>
                  <p className="text-white/70 text-xs leading-relaxed">
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

      {/* 4. Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-[5.5rem] font-serif font-bold mb-4 heading-2 oxanium-heading">
              Pricing
            </h2>
            <p className="text-xl text-[#FFFFFF] mb-6">
              明確な価格。隠れた費用なし。
            </p>
            <p className="text-white/70 max-w-2xl mx-auto">
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
                popular: true,
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
                className={clsx(
                  "p-8 rounded-3xl border relative flex flex-col h-full",
                  plan.popular
                    ? "bg-[#111111]/80 border-[#FFFFFF] shadow-[0_0_30px_rgba(204,221,0,0.15)]"
                    : "bg-[#111111]/30 border-white/10",
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#FFFFFF] text-[#050505] text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                )}
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
                <div className="mt-auto pt-6">
                  <p className="text-xs text-white/60 mb-6">{plan.time}</p>
                  <Button
                    href="#contact"
                    variant={plan.popular ? "primary" : "outline"}
                    className="w-full"
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
            <p className="text-white/80 text-xs leading-relaxed mb-4">
              月額保守：¥5,000〜¥10,000 /
              月（サーバー維持・軽微な修正・運用サポート込）
            </p>
            <p className="text-white/50 text-xs leading-relaxed">
              ＊
              別途、年間約6,000円のランニングコスト（サーバー＋ドメイン費用）がかかります。各サービス会社への直接のお支払いです。
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. Contact Section */}
      <section id="contact" className="py-32 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-[5.5rem] font-serif font-bold mb-6 heading-2 oxanium-heading">
              Let's Work Together.
            </h2>
            <p className="text-xl text-[#FFFFFF] mb-6">まず話しましょう。</p>
            <p className="text-white/70 max-w-2xl mx-auto">
              「うちに合うのかな？」と思ったら、そのまま相談してください。
              <br />
              現状のヒアリングと方向性の確認だけでも大歓迎です。
              <br />
              相談は無料。押し売りは一切しません。
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="bg-[#111111]/30 border border-[#888888]/30 p-8 md:p-12 rounded-3xl"
          >
            {/* コンタクトフォーム */}
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message'),
                budget: formData.get('budget'),
                timeline: formData.get('timeline'),
              };

              try {
                const res = await fetch('/api/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });

                if (res.ok) {
                  router.push('/contact/success');
                } else {
                  const errorData = await res.json();
                  alert(errorData.error || '送信に失敗しました。');
                  setIsSubmitting(false);
                }
              } catch (error) {
                console.error(error);
                alert('送信に失敗しました。');
                setIsSubmitting(false);
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs text-white/70">
                    お名前・会社名 <span className="text-[#FFFFFF]">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    disabled={isSubmitting}
                    className="w-full bg-[#050505] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs text-white/70">
                    メールアドレス <span className="text-[#FFFFFF]">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    disabled={isSubmitting}
                    className="w-full bg-[#050505] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-xs text-white/70">
                  ご相談内容（自由記入）{" "}
                  <span className="text-[#FFFFFF]">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  disabled={isSubmitting}
                  className="w-full bg-[#050505] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors resize-none"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="budget" className="text-xs text-white/70">
                    ご予算感（任意）
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    disabled={isSubmitting}
                    className="w-full bg-[#050505] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors appearance-none"
                  >
                    <option value="">選択してください</option>
                    <option value="15">〜15万</option>
                    <option value="35">15〜35万</option>
                    <option value="more">35万〜</option>
                    <option value="unknown">未定</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="timeline" className="text-xs text-white/70">
                    公開希望時期（任意）
                  </label>
                  <input
                    type="text"
                    id="timeline"
                    name="timeline"
                    disabled={isSubmitting}
                    placeholder="例：3ヶ月以内"
                    className="w-full bg-[#050505] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors"
                  />
                </div>
              </div>
              <div className="pt-6 text-center">
                <div className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full md:w-auto px-12"
                  >
                    {isSubmitting ? '送信中...' : '送信する'}
                  </Button>
                </div>
                <p className="text-xs text-white/40 mt-6">
                  対応時間：11:00〜19:00 ｜ 返信は原則24時間以内
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
