import React from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Button } from "../../components/ui/Button";

export default function ContactSuccessPage() {
  return (
    <div className="min-h-screen text-white overflow-hidden relative selection:bg-[#FFFFFF] selection:text-[#050505]">
      <div
        className="fixed inset-0 w-full h-full opacity-[0.07] pointer-events-none z-20"
        style={{ background: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      />
      <Header />
      
      <section className="relative h-screen flex flex-col justify-center items-center text-center px-6 z-10">
        <div className="max-w-2xl mx-auto space-y-8 bg-[#111111]/30 border border-[#888888]/30 p-8 md:p-16 rounded-3xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#FFFFFF]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold heading-2">
            送信完了
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            送信しました。<br className="hidden md:block"/>
            Noe Shifticaからのメールが近日中に届きます。<br className="hidden md:block"/>
            今しばらくお待ちください。
          </p>
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/" variant="secondary" size="lg" className="w-full sm:w-auto">
              トップページに戻る
            </Button>
            <Button href="/hearing" variant="primary" size="lg" className="w-full sm:w-auto">
              新しく入力する
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
