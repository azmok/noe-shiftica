import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Link from 'next/link';

export const metadata = {
    title: "利用規約 | Noe Shiftica",
    description: "Noe Shifticaのサービス利用規約について説明します。",
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#050505] text-[#ffffff] font-sans">
            <Header />

            <main className="container mx-auto max-w-4xl pt-32 pb-20 px-6">
                <div className="neu-dark-flat rounded-3xl p-8 md:p-12 mb-12">
                    <h1 className="text-3xl md:text-4xl mb-8 text-[#ffffff] font-serif font-bold">
                        利用規約
                    </h1>

                    <div className="space-y-12 text-[15px] font-[200] leading-relaxed text-[#ffffff]/80">
                        <section>
                            <h2 className="text-lg font-bold mb-4 text-[#ffffff] border-l-4 border-[#CCDD00] pl-4">
                                1. 規約の適用
                            </h2>
                            <p>
                                この利用規約（以下、「本規約」）は、Noe Shiftica（以下、「当スタジオ」）が提供するサービス（以下、「本サービス」）の利用条件を定めるものです。ユーザーは本サービスを利用することで、本規約に同意したものとみなされます。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-[#ffffff] border-l-4 border-[#CCDD00] pl-4">
                                2. サービスの内容
                            </h2>
                            <p>
                                当スタジオは、AIプロデュース、ブランディング、ウェブサイト制作、デザイン戦略等のクリエイティブサービスを提供します。具体的なサービス内容は、契約または個別の提案内容に基づきます。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-[#ffffff] border-l-4 border-[#CCDD00] pl-4">
                                3. 禁止事項
                            </h2>
                            <p>
                                ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>法令または公序良俗に違反する行為</li>
                                <li>当スタジオ、他のユーザー、または第三者の知的財産権、肖像権、プライバシー等を侵害する行為</li>
                                <li>本サービスの運営を妨害するおそれのある行為</li>
                                <li>不正なアクセスや、本システムの脆弱性を突く行為</li>
                                <li>その他、当スタジオが不適切と判断する行為</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-[#ffffff] border-l-4 border-[#CCDD00] pl-4">
                                4. 知的財産権
                            </h2>
                            <p>
                                本サービスを通じて提供される全てのコンテンツ（テキスト、デザイン、画像、プログラム等）に関する知的財産権は、別段の定めがない限り、当スタジオまたは正当な権利者に帰属します。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-[#ffffff] border-l-4 border-[#CCDD00] pl-4">
                                5. 免責事項
                            </h2>
                            <p>
                                当スタジオは、本サービスの内容について最大限の注意を払っていますが、その完全性、正確性、有用性を保証するものではありません。本サービスの利用によりユーザーに生じた損害について、当スタジオの故意または重大な過失がある場合を除き、一切の責任を負いません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-[#ffffff] border-l-4 border-[#CCDD00] pl-4">
                                6. 規約の変更
                            </h2>
                            <p>
                                当スタジオは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の規約は、本ウェブサイト上に掲示した時点で効力を生じるものとします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-[#ffffff] border-l-4 border-[#CCDD00] pl-4">
                                7. 準拠法・裁判管轄
                            </h2>
                            <p>
                                本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当スタジオの所在地を管轄する裁判所を専属的合意管轄とします。
                            </p>
                        </section>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/" className="neu-dark-btn px-8 py-3 rounded-full text-xs font-bold inline-block">
                        トップページへ戻る
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
