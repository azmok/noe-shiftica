import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Link from 'next/link';
import { tokushoContent } from './content';

export const metadata = {
    title: "特定商取引法に基づく表記 | Noe Shiftica",
    description: "Noe Shifticaの特定商取引法に基づく表記について説明します。",
};

export default function TokushoPage() {
    // Helper for inline markdown (bold)
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Helper to render markdown parts
    const renderMarkdown = (text: string) => {
        return text.split('\n\n').map((para, i) => {
            const trimmed = para.trim();
            if (!trimmed) return null;

            if (trimmed === '---') {
                return <hr key={i} className="my-8 border-white/10" />;
            }

            if (trimmed.startsWith('>')) {
                const quoteText = trimmed.split('\n').map(l => l.replace(/^>\s*/, '').trim()).join('\n');
                return (
                    <div key={i} className="mt-8 p-6 bg-white/5 rounded-2xl text-[13px] text-slate-400 italic leading-relaxed border-l-4 border-[#E2FF3D]">
                        {quoteText.split('\n').map((line, li) => (
                            <p key={li} className={li > 0 ? "mt-2" : ""}>{renderInline(line)}</p>
                        ))}
                    </div>
                );
            }

            if (trimmed.startsWith('|')) {
                const lines = trimmed.split('\n').filter(line => line.includes('|') && !line.includes('---|'));
                const tableData = lines.slice(1).map(line => {
                    const parts = line.split('|').map(p => p.trim()).filter(Boolean);
                    return { label: parts[0], value: parts[1] };
                });

                return (
                    <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xs">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="p-4 text-sm font-bold text-white border-b border-white/10 w-1/3">項目</th>
                                    <th className="p-4 text-sm font-bold text-white border-b border-white/10">内容</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row, ti) => (
                                    <tr key={ti} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                        <td className="p-4 text-[14px] font-medium text-slate-200 bg-white/[0.02]">{row.label}</td>
                                        <td className="p-4 text-[14px] font-light text-slate-300 leading-relaxed whitespace-pre-wrap">{renderInline(row.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }

            return <p key={i} className="text-[14px] text-slate-300 leading-relaxed">{renderInline(trimmed)}</p>;
        });
    };

    // Extract title and rest of the content
    const contentLines = tokushoContent.split('\n');
    const bodyContent = contentLines.slice(2).join('\n').trim();

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
                        特定商取引法に基づく表記
                    </h1>

                    <div className="space-y-6">
                        {renderMarkdown(bodyContent)}
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
