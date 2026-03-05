import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Link from 'next/link';

export const metadata = {
    title: "プライバシーポリシー | Noe Shiftica",
    description: "Noe Shifticaの個人情報保護方針について説明します。",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans">
            <Header />

            <main className="container mx-auto max-w-4xl pt-32 pb-20 px-6">
                <div className="neu-flat rounded-3xl p-8 md:p-12 mb-12">
                    <h1 className="text-3xl md:text-4xl mb-8 text-slate-900 font-serif font-bold">
                        プライバシーポリシー
                    </h1>

                    <div className="space-y-12 text-[15px] font-[200] leading-relaxed text-slate-600">
                        <section>
                            <h2 className="text-lg font-bold mb-4 text-slate-900 border-l-4 border-[#CCDD00] pl-4">
                                1. はじめに
                            </h2>
                            <p>
                                Noe Shiftica（以下、「当スタジオ」）は、本ウェブサイト上で提供するサービス（以下、「本サービス」）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」）を定めます。当スタジオは、個人情報の保護に関する法令を遵守し、ユーザーのプライバシーを尊重します。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-slate-900 border-l-4 border-[#CCDD00] pl-4">
                                2. 収集する情報
                            </h2>
                            <p>
                                当スタジオは、本サービスの利用にあたって、以下の個人情報を収集することがあります。
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>お名前、会社名</li>
                                <li>メールアドレス</li>
                                <li>お問い合わせ内容</li>
                                <li>クッキー（Cookie）およびIPアドレスなどのウェブサイト利用状況</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-slate-900 border-l-4 border-[#CCDD00] pl-4">
                                3. 利用目的
                            </h2>
                            <p>
                                当スタジオは、収集した個人情報を以下の目的で利用します。
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>本サービスの提供・運営のため</li>
                                <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                                <li>当スタジオが提供する他のサービスの案内、アップデート情報、キャンペーン等のメールを送付するため</li>
                                <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をお断りするため</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-slate-900 border-l-4 border-[#CCDD00] pl-4">
                                4. 情報の管理と保護
                            </h2>
                            <p>
                                当スタジオは、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。当スタジオは、法令に基づき開示することが必要である場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-slate-900 border-l-4 border-[#CCDD00] pl-4">
                                5. クッキー（Cookie）の使用
                            </h2>
                            <p>
                                本ウェブサイトでは、利用状況の分析や利便性の向上のためにクッキー（Cookie）を使用することがあります。ユーザーはブラウザの設定によりクッキーの受け入れを拒否することができますが、その場合、本サービスの一部が正常に機能しない可能性があります。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold mb-4 text-slate-900 border-l-4 border-[#CCDD00] pl-4">
                                6. お問い合わせ窓口
                            </h2>
                            <p>
                                本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
                            </p>
                            <div className="mt-4 p-6 neu-pressed rounded-xl inline-block">
                                <p className="m-0 font-bold text-slate-800">Noe Shiftica お問い合わせ窓口</p>
                                <p className="m-0 text-xs text-slate-500">Email: info@noeshiftica.com</p>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/" className="neu-btn px-8 py-3 rounded-full text-xs font-bold inline-block text-slate-700">
                        トップページへ戻る
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
