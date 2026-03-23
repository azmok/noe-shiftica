import { Metadata } from 'next';
import Link from 'next/link';
import { Monitor, FileText, Bot, ArrowRight, LayoutTemplate, DollarSign, RefreshCw, CheckCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Services | Noe Shiftica',
  description: 'What We Do. Noe Shifticaが提供する3つのこと。',
};

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-48 pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* 1. Hero */}
        <section className="mb-32 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#CCDD00] relative inline-block">
            What We Do.
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#CCDD00] shadow-[0_0_12px_#CCDD00] rounded-full"></span>
          </h1>
          <p className="text-[#919191] text-lg md:text-xl mt-6 tracking-wider">
            Noe Shifticaが提供する3つのこと
          </p>
        </section>

        {/* 2. Services (3カード) */}
        <section id="services-exmaples" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-32">
          {/* Card 1 */}
          <div className="neu-dark-flat hover:neu-dark-pressed transition-all duration-300 p-8 md:p-10 rounded-3xl flex flex-col items-start text-left group">
            <div className="text-[#CCDD00] mb-8 p-4 rounded-full bg-[#CCDD00]/10 group-hover:scale-110 transition-transform duration-300">
              <Monitor size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#ffffff] mb-4">Web Design & Build</h2>
            <p className="text-[#919191] mb-8 flex-1 leading-relaxed text-lg">
              LP・ポートフォリオ・コーポレートサイト。テンプレートなし、ブランドから設計。
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-white/80">
              {/* <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">Next.js</span>
              <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">Tailwind CSS</span>
              <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">Figma</span> */}
            </div>
          </div>

          {/* Card 2 */}
          <div className="neu-dark-flat hover:neu-dark-pressed transition-all duration-300 p-8 md:p-10 rounded-3xl flex flex-col items-start text-left group">
            <div className="text-[#6B2DA0] mb-8 p-4 rounded-full bg-[#6B2DA0]/10 group-hover:scale-110 transition-transform duration-300">
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#ffffff] mb-4">CMS & Content Operations</h2>
            <p className="text-[#919191] mb-8 flex-1 leading-relaxed text-lg">
              公開後も自分で更新できる設計。PayloadCMS でブログ・実績・採用など拡張可能。運用マニュアル付き。
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-white/80">
              {/* <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">Payload CMS</span>
              <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">Neon</span>
              <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">PostgreSQL</span> */}
            </div>
            <Link
              href="/services/cms-content-operations"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 group"
              style={{
                background: 'linear-gradient(145deg, #A060D0, #6B2DA0)',
                color: '#ffffff',
                boxShadow: '4px 4px 10px #000000, -2px -2px 8px #1a1a1a',
              }}
            >
              <span>事例詳細を見る</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="neu-dark-flat hover:neu-dark-pressed transition-all duration-300 p-8 md:p-10 rounded-3xl flex flex-col items-start text-left group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#CCDD00] text-[#050505] text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg">Premium</div>
            <div className="text-[#A060D0] mb-8 p-4 rounded-full bg-[#A060D0]/10 group-hover:scale-110 transition-transform duration-300">
              <Bot size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#ffffff] mb-4">AI Workflow Integration</h2>
            <p className="text-[#919191] mb-8 flex-1 leading-relaxed text-lg">
              業務フローへのAI組み込み。自動化設計・ツール選定。Premiumプランの中心サービス。要相談ベース。
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-white/80">
              {/* <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">Claude AI</span>
              <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">n8n</span>
              <span className="bg-[#121212] px-4 py-1.5 rounded-full border border-white/5">Automation</span> */}
            </div>
            <Link
              href="/services/scenarios"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 group"
              style={{
                background: 'linear-gradient(145deg, #A060D0, #6B2DA0)',
                color: '#ffffff',
                boxShadow: '4px 4px 10px #000000, -2px -2px 8px #1a1a1a',
              }}
            >
              <span>事例詳細を見る</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* 3. Tech Stack */}
        <section className="mb-32">
          <h2 className="text-sm md:text-base font-bold tracking-[0.3em] text-[#919191] uppercase mb-16 text-center">Powered By Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full max-w-4xl mx-auto text-left">
            <div>
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
            </div>

            <div>
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
            </div>
          </div>
        </section>

        {/* 4. こんな方へ */}
        <section className="mb-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#ffffff] mb-12">こんな方へ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="neu-dark-flat p-8 rounded-2xl flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 border border-white/5 text-center md:text-left">
              <div className="text-[#A060D0] flex-shrink-0"><LayoutTemplate size={40} /></div>
              <p className="text-[#ffffff] font-medium leading-snug text-lg">テンプレートに飽きた方</p>
            </div>
            <div className="neu-dark-flat p-8 rounded-2xl flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 border border-white/5 text-center md:text-left">
              <div className="text-[#CCDD00] flex-shrink-0"><DollarSign size={40} /></div>
              <p className="text-[#ffffff] font-medium leading-snug text-lg">制作費が不透明で不安な方</p>
            </div>
            <div className="neu-dark-flat p-8 rounded-2xl flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 border border-white/5 text-center md:text-left">
              <div className="text-[#6B2DA0] flex-shrink-0"><RefreshCw size={40} /></div>
              <p className="text-[#ffffff] font-medium leading-snug text-lg">公開後も育てたいサイトを持<br className="hidden lg:block" />ちたい方</p>
            </div>
          </div>
        </section>

        {/* 制作フロー */}
        <section className="mb-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#ffffff] mb-4">
            制作の流れ
          </h2>
          <p className="text-center text-[#919191] mb-16">発注から納品まで、全ステップを明示します。</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 relative">
            {/* connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-white/10 z-0" />
            {[
              {
                step: '01',
                title: 'お問い合わせ\n無料相談',
                desc: 'まずはメールまたはフォームからご連絡ください。ご要望・ご予算・スケジュールをヒアリングします。費用は一切かかりません。',
                color: '#CCDD00',
              },
              {
                step: '02',
                title: 'お見積もり\nご契約',
                desc: '内容を整理した上で、税込の明確なお見積もりを提示します。納得いただいた上でご契約へ。着手金（総額の50%）をお支払いいただきます。',
                color: '#A060D0',
              },
              {
                step: '03',
                title: '制作開始',
                desc: '着手金のご入金を確認後、制作をスタートします。進捗はこまめに共有し、フィードバックを反映しながら進めます。',
                color: '#6B2DA0',
              },
              {
                step: '04',
                title: '納品\n残金お支払い',
                desc: '完成データをご確認いただき、問題なければ納品完了。残金（総額の50%）をお支払いいただきます。',
                color: '#CCDD00',
              },
            ].map((item) => (
              <div key={item.step} className="neu-dark-flat rounded-3xl p-8 flex flex-col items-start relative z-10 border border-white/5">
                <span
                  className="text-4xl font-bold mb-4 font-mono"
                  style={{ color: item.color }}
                >
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-white mb-3 whitespace-pre-line leading-snug">
                  {item.title}
                </h3>
                <p className="text-[#919191] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 neu-dark-flat rounded-2xl p-6 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <CheckCircle size={24} className="text-[#CCDD00] shrink-0 mt-0.5" />
            <p className="text-[#919191] text-sm leading-relaxed">
              <span className="text-white font-semibold">キャンセルについて：</span>
              制作着手前のキャンセルは全額返金いたします。制作開始後のキャンセルは、着手金（総額の50%）の返金を承りかねます。
            </p>
          </div>
          <div className="mt-4 neu-dark-flat rounded-2xl p-6 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <CheckCircle size={24} className="text-[#A060D0] shrink-0 mt-0.5" />
            <p className="text-[#919191] text-sm leading-relaxed">
              <span className="text-white font-semibold">お支払い方法：</span>
              Stripeを通じて、クレジット／デビットカード・銀行振込に対応しています。今後コンビニ支払い・PayPay・Paidy等にも対応予定です。
            </p>
          </div>
        </section>

        {/* 5. Works */}
        <section className="mb-32">
          <div className="flex flex-col items-center md:items-start mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-[#ffffff] mb-4">Works.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Real project card */}
            <a
              href="https://demo-static-mirai-foundry.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="group neu-dark-flat aspect-[2/1] rounded-xl overflow-hidden relative border border-white/5 block"
            >
              <img
                src="/works/mirai-foundry-thumb.png"
                alt="MIRAI FOUNDRY — Digital Artifacts Foundry"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <p className="text-xs tracking-widest uppercase text-[#919191] mb-1">Web Design / Static</p>
                <h3 className="text-white text-xl font-bold">MIRAI FOUNDRY</h3>
                <p className="text-[#919191] text-sm mt-1">Digital Artifacts Foundry — Tokyo/Berlin</p>
              </div>
            </a>

            {/* Placeholder cards */}
            {[2, 3].map((item) => (
              <div key={item} className="neu-dark-flat aspect-[2/1] rounded-3xl flex items-center justify-center border border-white/5">
                <div className="flex flex-col items-center text-[#919191] opacity-40">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#919191] mb-6 flex items-center justify-center">
                    <span className="text-xl font-light">?</span>
                  </div>
                  <p className="text-sm tracking-widest uppercase">Project {item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. CTA */}
        <section className="flex flex-col items-center text-center mt-32 mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-[#ffffff] mb-6">Ready to Shift?</h2>
          <p className="text-[#919191] text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            まず話しましょう。相談は無料。押し売りなし。
          </p>
          <Link
            href="/#contact"
            className="mt-4 neu-dark-btn flex items-center justify-center space-x-3 px-10 py-5 rounded-full text-xl font-bold group"
            style={{
              background: 'linear-gradient(145deg, #dce811, #abc200)',
              color: '#050505',
              borderColor: 'transparent',
              boxShadow: '6px 6px 12px #000000, -6px -6px 12px #121212'
            }}
          >
            <span>無料相談を予約する</span>
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
