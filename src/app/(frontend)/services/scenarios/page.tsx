import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowDown, CheckCircle } from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export const metadata: Metadata = {
  title: 'AI Workflow Integration — 事例シナリオ | Noe Shiftica',
  description: 'AIを業務フローに組み込むとどうなるか。実際に起こりうる2つのシナリオをご紹介します。',
};

export default function ScenariosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-48 pb-24 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto">

        {/* Hero */}
        <section className="mb-20 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#CCDD00] relative inline-block">
            AI, in Your Workflow.
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#CCDD00] shadow-[0_0_12px_#CCDD00] rounded-full"></span>
          </h1>
          <p className="text-[#919191] text-lg md:text-xl mt-6 tracking-wider">
            業務に組み込むと、何が変わるのか。
          </p>
        </section>

        {/* Intro */}
        <section className="mb-20 flex justify-center">
          <p className="text-[#919191] text-sm leading-relaxed max-w-2xl text-center">
            「むずかしいことは、全部こちらでやります。あなたがするのは、いつも通り仕事をするだけ。2つの事例で、どんな変化が起きたか見てみましょう。」
          </p>
        </section>

        {/* Scenario 1 */}
        <section className="neu-dark-flat rounded-3xl p-10 md:p-14 mb-16">
          {/* Badge */}
          <span className="inline-block text-[#CCDD00] bg-[#CCDD00]/10 px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-8">
            Scenario 01
          </span>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            小さなサロンの「予約→フォロー」が全自動になった話
          </h2>

          <p className="text-[#919191] text-sm mb-8">
            大阪・北堀江でネイルサロンを一人で切り盛りするMさん
          </p>

          {/* Before */}
          <div className="mb-10">
            <p className="text-xs tracking-widest text-[#919191] uppercase mb-3">BEFORE</p>
            <ul className="space-y-2 text-white text-sm leading-relaxed list-none pl-0">
              {[
                'お客さんからの予約メッセージに気づくのが遅れる',
                '日程のやりとりを手打ちで何往復もする',
                '施術が終わったら、お礼のメッセージも手打ち',
                '「そろそろ来ませんか？」の声かけも、全部自分でやっていた',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[#919191] shrink-0 mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[#919191] text-sm mt-4 italic">
              「施術中はスマホを触れない。気づいたら返信が4時間後、なんてことも毎日のように起きていた。」
            </p>
          </div>

          {/* After flow */}
          <div>
            <p className="text-xs tracking-widest text-[#CCDD00] uppercase mb-4">AFTER</p>
            <div className="flex flex-col items-start gap-0 max-w-md">
              {[
                'お客さんからメッセージが届く',
                '自動で内容を読み取り、日程の確認メッセージを送る',
                '日程が決まったら、カレンダーに自動で登録される',
                '施術の翌日、お礼のメッセージが自動で届く',
                '約1ヶ月後、「次回はいかがですか？」のメッセージも自動で届く',
              ].map((step, i, arr) => (
                <div key={i} className="flex flex-col items-start w-full">
                  <div className="neu-dark-flat rounded-xl px-6 py-3 text-sm text-white border border-white/5 w-full">
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="pl-6 py-1">
                      <ArrowDown size={16} className="text-[#919191]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <blockquote className="border-l-4 border-[#CCDD00] pl-6 mt-8 italic text-white text-lg">
            「返信が早くなったって、お客さんに言ってもらえるようになりました。私は何もしてないんですけど（笑）」
          </blockquote>

          {/* Key points */}
          <div className="mt-10">
            <p className="text-xs tracking-widest text-[#A060D0] uppercase mb-3">POINT</p>
            <ul className="space-y-3">
              {[
                'Mさんは何もしていない。でも、お客さんには「返信が早い」と思われている',
                '仕組みの管理はNoe Shifticaが行うため、Mさんが設定を触ることはない',
                '追加の費用なく、毎日24時間動き続ける',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-[#919191] text-sm">
                  <CheckCircle size={16} className="text-[#CCDD00] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Scenario 2 */}
        <section className="neu-dark-flat rounded-3xl p-10 md:p-14 mb-32">
          {/* Badge */}
          <span className="inline-block text-[#CCDD00] bg-[#CCDD00]/10 px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-8">
            Scenario 02
          </span>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            採用担当が「書類選考の前処理」から解放された話
          </h2>

          <p className="text-[#919191] text-sm mb-8">
            滋賀の中小企業で、採用担当を兼務するKさん（総務2名体制）
          </p>

          {/* Before */}
          <div className="mb-10">
            <p className="text-xs tracking-widest text-[#919191] uppercase mb-3">BEFORE</p>
            <ul className="space-y-2 text-white text-sm leading-relaxed list-none pl-0">
              {[
                '応募書類が届くたびに、内容を手で表に転記する',
                '「今週の応募者一覧」を上司にメールで送る',
                '上司に「この人どんな人だっけ？」と聞かれるたびに、書類を一から探し直す',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[#919191] shrink-0 mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[#919191] text-sm mt-4 italic">
              「応募が10件来た週は、それだけで半日が消えた。本来の仕事が後回しになっていた。」
            </p>
          </div>

          {/* After flow */}
          <div>
            <p className="text-xs tracking-widest text-[#CCDD00] uppercase mb-4">AFTER</p>
            <div className="flex flex-col items-start gap-0 max-w-md">
              {[
                '応募書類が届く',
                '自動で内容を読み取り、必要な情報だけをまとめる',
                '一覧表に自動で追加される',
                '毎週月曜の朝、上司に「今週の応募まとめ」が自動で届く',
              ].map((step, i, arr) => (
                <div key={i} className="flex flex-col items-start w-full">
                  <div className="neu-dark-flat rounded-xl px-6 py-3 text-sm text-white border border-white/5 w-full">
                    {step}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="pl-6 py-1">
                      <ArrowDown size={16} className="text-[#919191]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <blockquote className="border-l-4 border-[#CCDD00] pl-6 mt-8 italic text-white text-lg">
            「月曜の朝に部長から『今週は何人来た？』って聞かれるのが怖くて。でも今は私が出社する前に、もう届いてるんです」
          </blockquote>

          {/* Key points */}
          <div className="mt-10">
            <p className="text-xs tracking-widest text-[#A060D0] uppercase mb-3">POINT</p>
            <ul className="space-y-3">
              {[
                'KさんはいつものツールをいつものSS使うだけ。新しいことを覚える必要はない',
                '書類を読んでまとめる作業は、すべて自動で行われる',
                '「AIが採用する」ではなく、「AIが準備して、判断は人間がする」という設計',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-[#919191] text-sm">
                  <CheckCircle size={16} className="text-[#CCDD00] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            あなたの仕事で、何を自動化できるか。
          </h2>
          <p className="text-[#919191] text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            まず話しましょう。相談は無料。押し売りなし。
          </p>
          <Link
            href="/#contact"
            className="mt-4 neu-dark-btn flex items-center justify-center space-x-3 px-10 py-5 rounded-full text-xl font-bold group transition-transform hover:scale-105"
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
          <Link
            href="/services"
            className="mt-8 text-sm text-[#919191] hover:text-white transition-colors duration-200"
          >
            ← サービス一覧に戻る
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
