import { getPayload } from "payload"
import configPromise from "@payload-config"
import type { Metadata } from "next"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { ChangelogTimeline, type ChangelogDayGroup } from "../components/ChangelogTimeline"
import type { Changelog } from "@/payload-types"

export const metadata: Metadata = {
  title: "Changelog | Noe Shiftica",
  description:
    "Noe Shiftica サイトの更新履歴。追加・変更・修正・削除を時系列のタイムラインで記録しています。",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Changelog | Noe Shiftica",
    description: "Noe Shiftica サイトの更新履歴を時系列のタイムラインで記録しています。",
    type: "website",
    url: "/changelog",
  },
}

/** Groups entries by calendar day (yyyy-mm-dd), preserving the incoming sort order. */
function groupByDate(entries: Changelog[]): ChangelogDayGroup[] {
  const map = new Map<string, Changelog[]>()
  for (const entry of entries) {
    const key = new Date(entry.date).toISOString().split("T")[0]
    const bucket = map.get(key)
    if (bucket) bucket.push(entry)
    else map.set(key, [entry])
  }
  return [...map.entries()].map(([date, group]) => ({ date, entries: group }))
}

export default async function ChangelogPage() {
  // ISR: revalidated on-demand via revalidatePath('/changelog') in Changelog.ts hooks.
  let entries: Changelog[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: "changelog",
      where: { status: { equals: "published" } },
      sort: "-date",
      depth: 0,
      limit: 1000,
      overrideAccess: true,
    })
    entries = result.docs
  } catch (error) {
    console.error("[ISR][/changelog] query failed — preserving stale cache:", error)
    throw error
  }

  const groups = groupByDate(entries)

  return (
    <div className="min-h-screen bg-background-void font-sans antialiased relative selection:bg-(--color-neu-primary)/40 overflow-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-(--color-neu-primary)/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-(--color-neu-primary)/5 blur-[100px]" />
      </div>

      <Header />

      <main className="grow px-4 sm:px-6 lg:px-12 pt-24 pb-24 md:pt-32 relative z-10">
        <div className="max-w-3xl mx-auto flex flex-col gap-10">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-8">
            <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-(--color-neu-primary)/15 text-[11px] font-bold text-(--color-neu-primary) uppercase tracking-widest border border-(--color-neu-primary)/30">
              Changelog
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">更新履歴</h1>
            <p className="text-slate-400 max-w-2xl leading-relaxed">
              サイトの細かな修正・更新の事実ログです。
              <span className="text-emerald-300">Added</span> /{" "}
              <span className="text-blue-300">Changed</span> /{" "}
              <span className="text-amber-300">Fixed</span> /{" "}
              <span className="text-red-300">Removed</span>{" "}
              のカテゴリで時系列に記録しています。
            </p>
          </header>

          {groups.length === 0 ? (
            <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl w-full backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4 text-white">まだ更新履歴はありません</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Payload CMS の「Changelog」コレクションから公開されると、ここに表示されます。
              </p>
            </div>
          ) : (
            <ChangelogTimeline groups={groups} />
          )}
        </div>
      </main>

      <Footer variant="blog" />
    </div>
  )
}
