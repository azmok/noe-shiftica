import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export const metadata: Metadata = {
  title: 'CMS & Content Operations | Noe Shiftica',
  description: '公開後も、自分たちで更新できるサイトへ。',
};

export default function CMSContentOperationsPage() {
  return (
    <>
      <Header />
      <div className="bg-white text-slate-900 rounded-[2.5rem] mx-4 sm:mx-6 md:mx-8 lg:mx-auto max-w-5xl mt-32 mb-16 shadow-[0_20px_60px_-15px_rgba(204,221,0,0.1)] overflow-hidden relative z-10 transition-shadow hover:shadow-[0_25px_60px_-15px_rgba(204,221,0,0.15)]">
        <main className="min-h-screen pt-24 pb-32 px-6 sm:px-10 md:px-16 max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <section className="mb-20 flex flex-col items-center text-center">
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-bold tracking-widest">
                かんたん更新
              </span>
              <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-bold tracking-widest">
                運用マニュアル付き
              </span>
              <span className="bg-primary/20 text-slate-900 px-4 py-2 rounded-full text-xs font-bold tracking-widest shadow-sm">
                外注ゼロへ
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-slate-900 tracking-tight leading-tight">
              CMS & Content Operations
            </h1>
            
            <p className="text-xl md:text-2xl font-semibold mt-4 tracking-wide text-slate-700 leading-snug">
              公開後も、自分たちで更新できるサイトへ。
            </p>
          </section>

          {/* Lead Text */}
          <section className="mb-32 flex justify-center">
            <p className="text-slate-600 text-lg md:text-[1.15rem] leading-loose max-w-2xl text-left sm:text-center font-medium">
              ホームページを公開したあと、「ブログを更新したい」「採用情報を変えたい」と思ったとき——<br /><br />
              制作会社に頼まなくても、自分たちで変更できる仕組みをつくります。<br className="hidden sm:block" />
              むずかしい操作は不要。スマホのメモアプリを使うような感覚で、文章や写真を投稿できます。
            </p>
          </section>

          {/* Scenarios Title */}
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-slate-400 tracking-wider">
              Before / After
            </h2>
          </div>

          {/* Scenario 01 */}
          <section className="bg-slate-50 border border-slate-100 rounded-4xl p-8 md:p-14 mb-16">
            {/* Badge */}
            <span className="inline-block bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold tracking-widest mb-8">
              Scenario 01
            </span>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-12 tracking-tight">
              飲食店オーナー
            </h2>

            {/* Before */}
            <div className="mb-12 border-l-4 border-slate-300 pl-6 md:pl-8">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Before</p>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                新メニューをホームページに載せるたびに、制作会社へメールで依頼。<br className="hidden xl:block"/>
                返信を待って、直してもらって、確認して……1件の更新に数日かかっていた。
              </p>
            </div>

            {/* After */}
            <div className="bg-white border text-slate-900 border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
              <p className="text-xs font-extrabold tracking-widest text-[#B0BF00] uppercase mb-4 pl-4">After</p>
              <p className="text-slate-900 text-lg md:text-xl leading-relaxed font-bold pl-4">
                管理画面を開いて、写真をアップして、文章を入力して、「公開」を押すだけ。<br className="hidden xl:block" />
                スタッフが撮ったランチ写真を、その日のうちに載せられるようになった。
              </p>
            </div>
          </section>

          {/* Scenario 02 */}
          <section className="bg-slate-50 border border-slate-100 rounded-4xl p-8 md:p-14 mb-32">
            {/* Badge */}
            <span className="inline-block bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold tracking-widest mb-8">
              Scenario 02
            </span>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-12 tracking-tight">
              士業・専門サービス（税理士事務所）
            </h2>

            {/* Before */}
            <div className="mb-12 border-l-4 border-slate-300 pl-6 md:pl-8">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Before</p>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                お知らせや採用情報を更新するたびに外注。<br className="hidden xl:block"/>
                「小さな変更なのに毎回お金がかかる」と感じていた。
              </p>
            </div>

            {/* After */}
            <div className="bg-white border text-slate-900 border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
              <p className="text-xs font-extrabold tracking-widest text-[#B0BF00] uppercase mb-4 pl-4">After</p>
              <p className="text-slate-900 text-lg md:text-xl leading-relaxed font-bold pl-4">
                Noe Shifticaが用意した運用マニュアルを見ながら、事務スタッフが自分で更新できるように。<br className="hidden xl:block" />
                外注費ゼロ、思い立ったその日に公開できる。
              </p>
            </div>
          </section>

          {/* What's Included Section */}
          <section className="mb-32">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-16 tracking-tight">
              含まれるサポート内容
            </h2>
            <div className="bg-slate-900 text-white p-10 md:p-14 rounded-4xl shadow-xl max-w-3xl mx-auto">
              <ul className="space-y-8">
                {[
                  '更新しやすい管理画面のセットアップ',
                  'ブログ・実績・採用など、必要なページの構成設計',
                  '管理画面のブランドカラーへのカスタマイズ',
                  'わかりやすい運用マニュアル（PDF形式）',
                  '公開後1ヶ月のサポート'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 md:gap-6">
                    <span className="mt-1 bg-primary/20 p-1.5 rounded-full shrink-0">
                      <CheckCircle size={20} className="text-primary" strokeWidth={2.5} />
                    </span>
                    <span className="text-[1.1rem] md:text-[1.2rem] font-medium tracking-wide leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="flex flex-col items-center text-center pb-8 border-t border-slate-100 pt-20">
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-10 max-w-2xl mx-auto leading-normal tracking-tight">
              「更新、自分でできるかな？」と思ったら、まず話しましょう。
            </h2>
            <Link
              href="/#contact"
              className="mt-4 flex items-center justify-center space-x-3 px-10 py-5 rounded-full text-xl font-bold group"
              style={{
                background: 'linear-gradient(145deg, #dce811, #abc200)',
                color: '#050505',
                borderColor: 'transparent',
                boxShadow: '0 10px 25px -5px rgba(204,221,0,0.4)',
              }}
            >
              <span>無料相談する</span>
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/services"
              className="mt-12 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors duration-300"
            >
              ← サービス一覧に戻る
            </Link>
          </section>

        </main>
      </div>
      <Footer />
    </>
  );
}
