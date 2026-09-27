"use client"

import React, { useEffect, useState } from "react"
import type { ArticleHeading } from "@/lib/articleHeadings"

// A heading counts as "being read" once its top passes this line (px from the viewport top).
const ACTIVE_LINE = 120

export const ArticleTocSidebar: React.FC<{ entries: ArticleHeading[]; scopeId: string }> = ({ entries, scopeId }) => {
    const [activeId, setActiveId] = useState<string | null>(null)

    useEffect(() => {
        const scope = document.getElementById(scopeId)
        if (!scope) return
        const tocIds = new Set(entries.map((e) => e.id))
        let frame = 0

        const update = () => {
            frame = 0
            const visible = Array.from(scope.querySelectorAll<HTMLElement>("[data-heading-id]")).filter(
                (el) => el.offsetParent !== null && tocIds.has(el.dataset.headingId ?? ""),
            )
            let current = visible[0]?.dataset.headingId ?? null
            for (const el of visible) {
                if (el.getBoundingClientRect().top > ACTIVE_LINE) break
                current = el.dataset.headingId ?? current
            }
            setActiveId(current)
        }
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update)
        }

        update()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [entries, scopeId])

    return (
        <nav aria-label="目次" className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <p className="text-[10px] font-bold text-(--color-neu-primary) uppercase tracking-[0.2em] mb-5">Contents</p>
            <ol className="space-y-1 border-l border-white/10">
                {entries.map((h) => {
                    const active = h.id === activeId
                    return (
                        <li key={h.id}>
                            <a
                                href={`#${h.id}`}
                                aria-current={active ? "location" : undefined}
                                className={`block -ml-px border-l py-1.5 leading-snug! transition-colors ${h.level === 3 ? "pl-7 text-[12px]" : "pl-4 text-[13px]"} ${active ? "border-(--color-neu-primary) text-(--color-neu-primary)!" : "border-transparent text-slate-400! hover:text-white!"}`}
                            >
                                {h.text}
                            </a>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
