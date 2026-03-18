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
                return <hr key={i} className="my-8 border-slate-100" />;
            }

            if (trimmed.startsWith('>')) {
                const quoteText = trimmed.split('\n').map(l => l.replace(/^>\s*/, '').trim()).join('\n');
                return (
                    <div key={i} className="mt-8 p-6 bg-slate-50 rounded-2xl text-[13px] text-slate-500 italic leading-relaxed border-l-2 border-slate-200">
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
                    <div key={i} className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="p-4 text-sm font-bold text-slate-900 border-b border-slate-100 w-1/3">項目</th>
                                    <th className="p-4 text-sm font-bold text-slate-900 border-b border-slate-100">内容</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row, ti) => (
                                    <tr key={ti} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                        <td className="p-4 text-[14px] font-medium text-slate-700 bg-slate-50/50">{row.label}</td>
                                        <td className="p-4 text-[14px] font-light text-slate-600 leading-relaxed whitespace-pre-wrap">{renderInline(row.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }

            return <p key={i} className="text-[14px] text-slate-600">{renderInline(trimmed)}</p>;
        });
    };

    // Extract title and rest of the content
    const contentLines = tokushoContent.split('\n');
    const bodyContent = contentLines.slice(2).join('\n').trim();

    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans">
            <Header />

            <main className="container mx-auto max-w-4xl pt-32 pb-20 px-6">
                <div className="neu-flat rounded-3xl p-8 md:p-12 mb-12">
                    <h1 className="text-3xl md:text-4xl mb-8 text-slate-900 font-serif font-bold">
                        特定商取引法に基づく表記
                    </h1>

                    <div className="space-y-6">
                        {renderMarkdown(bodyContent)}
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
