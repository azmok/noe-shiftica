import React from "react"
import type { ArticleHeading } from "@/lib/articleHeadings"

const MIN_ENTRIES = 2

export const tocEntries = (headings: ArticleHeading[]): ArticleHeading[] => {
    const entries = headings.filter((h) => h.level === 2 || h.level === 3)
    return entries.length >= MIN_ENTRIES ? entries : []
}

// Link colors and line-height use `!` because the global `nav a` rule in styles.css
// is unlayered and would otherwise override these utilities.
export const ArticleToc: React.FC<{ entries: ArticleHeading[] }> = ({ entries }) => {
    if (entries.length === 0) return null
    return (
        <nav aria-label="目次">
            <details open className="group rounded-(--mobile-radius) md:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <summary className="flex items-center justify-between gap-4 p-6 list-none [&::-webkit-details-marker]:hidden select-none">
                    <span className="text-sm font-bold text-(--color-neu-primary) uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-(--color-neu-primary)" />
                        Contents
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-slate-400 transition-transform duration-300 group-open:rotate-180">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </summary>
                <ol className="px-6 pb-6 -mt-2 space-y-2.5">
                    {entries.map((h) => (
                        <li key={h.id} className={h.level === 3 ? "pl-4 border-l border-white/10" : ""}>
                            <a
                                href={`#${h.id}`}
                                className={`block leading-snug! transition-colors hover:text-(--color-neu-primary)! ${h.level === 3 ? "text-[13px] text-slate-400!" : "text-sm text-slate-200!"}`}
                            >
                                {h.text}
                            </a>
                        </li>
                    ))}
                </ol>
            </details>
        </nav>
    )
}
