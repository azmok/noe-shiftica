import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Link from 'next/link';
import { privacyPolicyContent } from './content';

export const metadata = {
    title: "プライバシーポリシー | Noe Shiftica",
    description: "Noe Shifticaの個人情報保護方針について説明します。",
};

export default function PrivacyPolicyPage() {
    // Helper to render inline markdown (e.g. bold)
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Helper to render body with markdown support
    const renderBody = (text: string) => {
        return text.split('\n\n').map((para, i) => {
            const trimmed = para.trim();
            if (!trimmed) return null;

            if (trimmed === '---') {
                return <hr key={i} className="my-8 border-white/10" />;
            }

            if (trimmed.startsWith('>')) {
                const quoteText = trimmed.split('\n').map(l => l.replace(/^>\s*/, '').trim()).join('\n');
                return (
                    <div key={i} className="my-6 p-6 bg-white/5 rounded-2xl text-[13px] text-slate-400 italic leading-relaxed border-l-4 border-[#E2FF3D]">
                        {quoteText.split('\n').map((line, li) => (
                            <p key={li} className={li > 0 ? "mt-2" : ""}>{renderInline(line)}</p>
                        ))}
                    </div>
                );
            }

            if (trimmed.startsWith('|')) {
                const rows = trimmed.split('\n').filter(r => r.includes('|') && !r.includes('---|'));
                return (
                    <div key={i} className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xs">
                        <table className="w-full text-left border-collapse text-sm">
                            <tbody>
                                {rows.map((row, ri) => (
                                    <tr key={ri} className={ri === 0 ? "bg-white/5 font-bold text-white" : "border-t border-white/5 text-slate-300"}>
                                        {row.split('|').filter(c => c.trim() !== '').map((cell, ci) => (
                                            <td key={ci} className="p-3 border-x border-white/5">
                                                {renderInline(cell.trim())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            if (trimmed.startsWith('- ')) {
                return (
                    <ul key={i} className="list-disc pl-5 my-4 space-y-1 text-slate-300 leading-relaxed">
                        {trimmed.split('\n').map((item, ii) => (
                            <li key={ii}>{renderInline(item.replace(/^- \s*/, '').trim())}</li>
                        ))}
                    </ul>
                );
            }
            return <p key={i} className="mb-4 text-slate-300 leading-relaxed">{renderInline(trimmed)}</p>;
        });
    };

    const lines = privacyPolicyContent.split('\n');
    const firstSectionIndex = lines.findIndex(line => line.trim().startsWith('## '));
    const introText = lines.slice(1, firstSectionIndex).join('\n').trim();
    const remainingContent = lines.slice(firstSectionIndex).join('\n');
    
    // Split into sections
    const sections = remainingContent.split('\n## ').filter(Boolean).map(s => {
        const [titleLine, ...rest] = s.split('\n');
        // Clean title: remove leading number like "1. " if present in original markdown
        const title = titleLine.replace(/^##\s*/, '').replace(/^\d+\.\s*/, '').trim();
        const body = rest.join('\n').trim();
        return { title, body };
    });

    return (
        <div className="min-h-screen bg-background-void text-slate-300 font-sans relative overflow-hidden">
            {/* Premium Depth Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neu-primary/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-neu-primary/5 blur-[100px]" />
                <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] rounded-full bg-blue-500/5 blur-[80px]" />
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ filter: 'url(#noiseFilterDetail)' }}></div>
            </div>

            <Header />

            <main className="container mx-auto max-w-4xl pt-32 pb-20 px-6 relative z-10">
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl mb-8 text-white font-sans font-bold tracking-tight">
                        プライバシーポリシー
                    </h1>

                    <div className="space-y-12 text-[15px] leading-relaxed">
                        <div className="intro-content">
                            {renderBody(introText)}
                        </div>

                        {sections.map((section, i) => (
                            <section key={i}>
                                <h2 className="text-lg font-bold mb-4 text-white border-l-4 border-[#E2FF3D] pl-4">
                                    {/* The index is generated here, so we remove it from the source title */}
                                    {i + 1}. {section.title}
                                </h2>
                                <div className="section-body">
                                    {renderBody(section.body)}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/" className="relative z-10 px-8 py-3 rounded-full text-xs font-bold inline-block text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5">
                        トップページへ戻る
                    </Link>
                </div>
            </main>

            <Footer />

            {/* SVG Global Filters */}
            <svg className="hidden">
                <filter id="noiseFilterDetail">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
            </svg>
        </div>
    );
}
