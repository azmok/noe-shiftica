import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, ArrowDown } from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export const metadata: Metadata = {
  title: 'AI Workflow Integration — 事例シナリオ | Noe Shiftica',
  description: 'AIを業務フローに組み込むと何が変わるのか。実際に起こりうる2つのシナリオをご紹介します。',
};

export default function ScenariosPage() {
  return (
    <>
      <Header />
      <div className="bg-white text-slate-900 rounded-[2.5rem] mx-4 sm:mx-6 md:mx-8 lg:mx-auto max-w-5xl mt-32 mb-16 shadow-[0_20px_60px_-15px_rgba(204,221,0,0.1)] overflow-hidden relative z-10 transition-shadow hover:shadow-[0_25px_60px_-15px_rgba(204,221,0,0.15)]">
        <main className="min-h-screen pt-24 pb-32 px-6 sm:px-10 md:px-16 max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <section className="mb-20 flex flex-col items-center text-center">
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-bold tracking-widest">
                業務自動化
              </span>
              <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-bold tracking-widest">
                24時間稼働
              </span>
              <span className="bg-primary/20 text-slate-900 px-4 py-2 rounded-full text-xs font-bold tracking-widest shadow-sm">
                運用コスト削減
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-slate-900 tracking-tight leading-tight">
              AI Workflow Integration
            </h1>
            
            <p className="text-xl md:text-2xl font-semibold mt-4 tracking-wide text-slate-700 leading-snug">
              業務に組み込むと、何が変わるのか。
            </p>
          </section>

          {/* Lead Text */}
          <section className="mb-32 flex justify-center">
            <p className="text-slate-600 text-lg md:text-[1.15rem] leading-loose max-w-2xl text-left sm:text-center font-medium">
              「むずかしいことは、全部こちらでやります。あなたがするのは、いつも通り仕事をするだけ。<br /><br />
              最新のAI技術を裏側で連携させ、2つの事例でどんな変化が起きたか見てみましょう。」
            </p>
          </section>

          {/* Scenarios Title */}
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-slate-400 tracking-wider">
              Before / After Scenarios
            </h2>
          </div>

          {/* Scenario 01 */}
          <section className="bg-slate-50 border border-slate-100 rounded-4xl p-8 md:p-14 mb-16">
            {/* Badge */}
            <span className="inline-block bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold tracking-widest mb-8">
              Scenario 01
            </span>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
              一人サロンの予約・フォロー全自動化
            </h2>
            <p className="text-slate-500 text-sm mb-12 font-medium">
              大阪・北堀江でネイルサロンを一人で切り盛りするMさんの事例
            </p>

            {/* Before */}
            <div className="mb-12 border-l-4 border-slate-300 pl-6 md:pl-8">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Before</p>
              <ul className="space-y-2 text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                <li>・ 施術中でメッセージに気づくのが遅れ、返信が数時間後になる</li>
                <li>・ 日程調整のやりとりに時間が取られ、深夜までスマホを手放せない</li>
                <li>・ お礼メールや「1ヶ月後の再来店」の声かけが漏れてしまう</li>
              </ul>
            </div>

            {/* After flow style but integrated into the light design */}
            <div className="bg-white border text-slate-900 border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
              <p className="text-xs font-extrabold tracking-widest text-[#B0BF00] uppercase mb-6 pl-4">After</p>
              
              <div className="flex flex-col items-start gap-0 pl-4">
                {[
                  'メッセージから希望日程をAIが自動読み取り',
                  'カレンダーの空き枠をチェックして即レス',
                  '予約確定と同時にカレンダーへ自動登録',
                  '施術翌日の「お礼」も1ヶ月後の「再案内」も自動送信',
                ].map((step, i, arr) => (
                  <div key={i} className="flex flex-col items-start w-full">
                    <div className="bg-slate-50 rounded-xl px-5 py-3 text-sm md:text-base text-slate-700 border border-slate-100 w-full font-bold">
                      {step}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="pl-6 py-2">
                        <ArrowDown size={18} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <blockquote className="mt-10 pl-6 border-l-2 border-primary italic text-slate-800 text-lg md:text-xl font-bold">
                「返信が早くなったって、お客さんに言ってもらえるようになりました。私は何もしてないんですけど（笑）」
              </blockquote>
            </div>
          </section>

          {/* Scenario 02 */}
          <section className="bg-slate-50 border border-slate-100 rounded-4xl p-8 md:p-14 mb-32">
            {/* Badge */}
            <span className="inline-block bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold tracking-widest mb-8">
              Scenario 02
            </span>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
              採用担当の「書類選考前処理」の自動化
            </h2>
            <p className="text-slate-500 text-sm mb-12 font-medium">
              滋賀の中小企業で、採用を兼務するKさんの事例（総務2名体制）
            </p>

            {/* Before */}
            <div className="mb-12 border-l-4 border-slate-300 pl-6 md:pl-8">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Before</p>
              <ul className="space-y-2 text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                <li>・ 応募書類が届くたびに、内容を手動でスプレッドシートに転記</li>
                <li>・ 上司に「この人どんな人だっけ？」と聞かれるたびに書類を探し直す</li>
                <li>・ 毎週の応募状況まとめ作成だけで、月曜午前中が消えていた</li>
              </ul>
            </div>

            {/* After */}
            <div className="bg-white border text-slate-900 border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
              <p className="text-xs font-extrabold tracking-widest text-[#B0BF00] uppercase mb-6 pl-4">After</p>

              <div className="flex flex-col items-start gap-0 pl-4">
                {[
                  '書類が届くとAIが経歴・スキルを自動で要約',
                  '管理ツールの一覧表へ瞬時に自動反映',
                  '毎週自動で「今週の応募サマリー」を上司にメール送付',
                  'Kさんは最終的な「面談判断」にだけ集中できるように',
                ].map((step, i, arr) => (
                  <div key={i} className="flex flex-col items-start w-full">
                    <div className="bg-slate-50 rounded-xl px-5 py-3 text-sm md:text-base text-slate-700 border border-slate-100 w-full font-bold">
                      {step}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="pl-6 py-2">
                        <ArrowDown size={18} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <blockquote className="mt-10 pl-6 border-l-2 border-primary italic text-slate-800 text-lg md:text-xl font-bold">
                「月曜の朝に部長から状況を聞かれるのが怖かったのですが、今は私が出社する前にAIが報告を済ませてくれています。」
              </blockquote>
            </div>
          </section>

          {/* What's Included Section (Unifying with CMS page style) */}
          <section className="mb-32">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-16 tracking-tight">
              導入後のポイント
            </h2>
            <div className="bg-slate-900 text-white p-10 md:p-14 rounded-4xl shadow-xl max-w-3xl mx-auto">
              <ul className="space-y-8">
                {[
                  'いつものツールをそのまま使うだけ。新しい操作を覚える必要はありません',
                  'AIが「準備」をし、人間が「判断」する。ミスを防ぎ、重要な決定をサポートします',
                  '仕組みのメンテはNoe Shifticaが行うため、設定を触る手間はゼロ',
                  '24時間365日、追加費用なくAIが働き続けます',
                  '導入後1ヶ月の運用定着サポート'
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
              あなたの仕事で、何を自動化できるか。まず話しましょう。
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

