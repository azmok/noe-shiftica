"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface ContactSectionProps {
  fadeIn: Variants;
  selectedBudget?: string;
}

export function ContactSection({ fadeIn, selectedBudget }: ContactSectionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budget, setBudget] = useState("");
  const [hasHearingData, setHasHearingData] = useState(false);
  const [includeHearingData, setIncludeHearingData] = useState(true);

  // プラン選択時に予算を更新
  React.useEffect(() => {
    if (selectedBudget) {
      setBudget(selectedBudget);
    }
  }, [selectedBudget]);

  // ヒアリングデータの有無を確認
  React.useEffect(() => {
    try {
      const itemStr = localStorage.getItem('noeShiftica_Hearing_Data');
      if (itemStr) {
        const item = JSON.parse(itemStr);
        if (Date.now() - item.timestamp <= 7 * 24 * 60 * 60 * 1000) {
          setHasHearingData(true);
        } else {
          localStorage.removeItem('noeShiftica_Hearing_Data');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

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
          <p className="font-medium text-xl text-[#FFFFFF] mb-6">まず話しましょう。</p>
          <p className="font-thin text-[0.9375rem] leading-[1.5rem] text-white/70 test-center">
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
          className="flex justify-center mb-16"
        >
          <Link
            id="hearing-cta-button"
            href="/hearing"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-lg transition-all group border"
          >
            <Sparkles size={20} className="group-hover:animate-pulse" />
            ヒアリングシートを試す
          </Link>
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

            let finalHearingData = null;
            if (hasHearingData && includeHearingData) {
              try {
                const itemStr = localStorage.getItem('noeShiftica_Hearing_Data');
                if (itemStr) {
                  finalHearingData = JSON.parse(itemStr);
                }
              } catch (e) { }
            }

            const data = {
              name: formData.get('name'),
              email: formData.get('email'),
              message: formData.get('message'),
              budget: formData.get('budget'),
              timeline: formData.get('timeline'),
              hearingData: finalHearingData,
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
                  className="w-full bg-background-void border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors"
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
                  className="w-full bg-background-void border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors"
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
                className="w-full bg-background-void border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors resize-none"
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
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-background-void border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors appearance-none"
                >
                  <option value="">選択してください</option>
                  <option value="15">15万円から</option>
                  <option value="35">35万円から</option>
                  <option value="unknown">要相談</option>
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
                  className="w-full bg-background-void border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFFFFF] disabled:opacity-50 transition-colors"
                />
              </div>
            </div>

            {hasHearingData && (
              <div className="pt-2 text-left">
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-[#E2FF3D]/5 border border-[#E2FF3D]/20 rounded-xl hover:border-[#E2FF3D]/50 transition-colors select-none group">
                  <div className={`w-5 h-5 flex items-center justify-center border-2 rounded-md ${includeHearingData ? 'border-[#E2FF3D] bg-[#E2FF3D]' : 'border-[#8A8A93] bg-[#121216]'} transition-all shrink-0 group-hover:border-[#E2FF3D]`}>
                    {includeHearingData && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#08080A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span className="text-[14px] font-bold text-white leading-tight">
                    💡 先ほど入力したヒアリングシートの内容を一緒に送信する
                  </span>
                </label>
              </div>
            )}

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
                返信は原則24時間以内。打ち合わせはすべてオンライン（Zoom / Google Meet）対応です。
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
