"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

interface ContactSectionProps {
  fadeIn: Variants;
}

export function ContactSection({ fadeIn }: ContactSectionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
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
          <p className="text-white/70 test-center">
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
            <div className="pt-12 md:pt-14 text-center">
              <div className={isSubmitting ? "opacity-50 pointer-events-none mb-8" : "mb-8"}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full md:w-auto px-12"
                >
                  {isSubmitting ? '送信中...' : '送信する'}
                </Button>
              </div>
              <p className="text-xs text-white/40 mt-8">
                対応時間：11:00〜19:00 ｜ 返信は原則24時間以内
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
