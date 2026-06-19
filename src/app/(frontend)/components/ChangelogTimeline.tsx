"use client"

import { useState } from "react"
import type { Changelog } from "@/payload-types"

export interface ChangelogDayGroup {
  /** ISO date string (yyyy-mm-dd) used as the group key/heading. */
  date: string
  entries: Changelog[]
}

interface ChangelogTimelineProps {
  groups: ChangelogDayGroup[]
  /** How many day-groups to reveal per "もっと見る" click. */
  pageSize?: number
}

const CATEGORY_STYLES: Record<
  Changelog["category"],
  { label: string; badge: string; dot: string }
> = {
  Added: {
    label: "Added",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  Changed: {
    label: "Changed",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
  },
  Fixed: {
    label: "Fixed",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  Removed: {
    label: "Removed",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
}

function formatDate(value: string): string {
  return new Date(value).toISOString().split("T")[0].replace(/-/g, ".")
}

export function ChangelogTimeline({ groups, pageSize = 8 }: ChangelogTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const visibleGroups = groups.slice(0, visibleCount)
  const hasMore = visibleCount < groups.length

  return (
    <div className="flex flex-col">
      <ol className="relative border-l border-white/10 ml-3">
        {visibleGroups.map((group) => (
          <li key={group.date} className="mb-12 ml-6">
            {/* Timeline node */}
            <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-(--color-neu-primary) ring-4 ring-background-void" />

            {/* Date heading + version(s) */}
            <div className="flex flex-wrap items-baseline gap-3 mb-4">
              <time className="text-lg font-bold text-white tracking-tight">
                {formatDate(group.date)}
              </time>
              {Array.from(
                new Set(
                  group.entries
                    .map((e) => e.version)
                    .filter((v): v is string => !!v)
                )
              ).map((v) => (
                <span
                  key={v}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-300"
                >
                  {v}
                </span>
              ))}
            </div>

            {/* Entries for this date */}
            <div className="flex flex-col gap-4">
              {group.entries.map((entry) => {
                const style = CATEGORY_STYLES[entry.category]
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${style.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                    {entry.changes && entry.changes.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-2">
                        {entry.changes.map((change) => (
                          <li
                            key={change.id || change.text}
                            className="flex gap-2 text-slate-300 text-sm leading-relaxed"
                          >
                            <span className="text-slate-500 mt-0.5 select-none">–</span>
                            <span>{change.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </li>
        ))}
      </ol>

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + pageSize)}
          className="self-center mt-2 px-6 h-11 rounded-full border border-white/15 bg-white/5 text-sm font-bold text-white hover:bg-white/10 hover:border-white/25 transition-all active:scale-95"
        >
          もっと見る
        </button>
      )}
    </div>
  )
}
