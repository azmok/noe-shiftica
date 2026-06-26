import Link from "next/link"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import type { Metadata } from "next"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { GcsImage } from "@/lib/GcsImage"
import type { WhatsNew, Media } from "@/payload-types"

export const metadata: Metadata = {
  title: "What's New | Noe Shiftica",
  description:
    "Noe Shiftica の管理画面・機能アップデートのお知らせ。新しい使い方や改善点をクライアント目線でご紹介します。",
  alternates: {
    canonical: "/whats-new",
  },
  openGraph: {
    title: "What's New | Noe Shiftica",
    description:
      "Noe Shiftica の管理画面・機能アップデートのお知らせ。新しい使い方や改善点をご紹介します。",
    type: "website",
    url: "/whats-new",
  },
}

function formatDate(value?: string | null): string {
  if (!value) return ""
  return new Date(value).toISOString().split("T")[0].replace(/-/g, ".")
}

function getImageUrl(image: WhatsNew["featuredImage"]): string | null {
  if (image && typeof image === "object") {
    return (image as Media).url || null
  }
  return null
}

export default async function WhatsNewPage() {
  // ISR: revalidated on-demand via revalidatePath('/whats-new') in WhatsNew.ts hooks.
  let posts: WhatsNew[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: "whats-new",
      where: { status: { equals: "published" } },
      sort: "-publishedAt",
      depth: 1,
      limit: 100,
      overrideAccess: true,
    })
    posts = result.docs
  } catch (error) {
    console.error("[ISR][/whats-new] query failed — preserving stale cache:", error)
    throw error
  }

  return (
    <div className="min-h-screen bg-background-void font-sans antialiased relative selection:bg-(--color-neu-primary)/40 overflow-hidden">
      {/* Premium Depth Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-(--color-neu-primary)/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-(--color-neu-primary)/5 blur-[100px]" />
        <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      <Header />

      <main className="grow px-4 sm:px-6 lg:px-12 pt-24 pb-24 md:pt-32 md:pb-32 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          {/* Page Header — clearly a feature-announcement feed, distinct from /blog */}
          <header className="flex flex-col gap-4 border-b border-white/10 pb-8">
            <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-(--color-neu-primary)/15 text-[11px] font-bold text-(--color-neu-primary) uppercase tracking-widest border border-(--color-neu-primary)/30">
              Product Updates
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
              What&apos;s New
            </h1>
            <p className="text-slate-400 max-w-2xl leading-relaxed">
              管理画面と機能のアップデートを「こう使えますよ」とお届けします。新機能・改善点の活用方法をチェックしてください。
            </p>
          </header>

          {posts.length === 0 ? (
            <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl w-full backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4 text-white">まだお知らせはありません</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Payload CMS の「What&apos;s New」コレクションから公開されると、ここに表示されます。
              </p>
              <Link href="/admin" className="text-(--color-neu-primary) font-bold hover:underline">
                Admin パネルへログインする
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {posts.map((post) => {
                const imgUrl = getImageUrl(post.featuredImage)
                return (
                  <Link
                    key={post.id}
                    href={`/whats-new/${post.slug}`}
                    className="group flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden transition-all hover:border-white/20 hover:-translate-y-1 duration-300 shadow-xl"
                  >
                    <div className="relative w-full aspect-video bg-black/40 overflow-hidden">
                      {imgUrl ? (
                        <div className="w-full h-full relative transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
                          <GcsImage src={imgUrl} alt={post.title} objectFit="cover" className="w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-(--color-neu-primary)/10 to-transparent">
                          <span className="text-(--color-neu-primary)/40 text-5xl font-black tracking-tighter">NS</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 p-6 grow">
                      <span className="text-slate-400 text-xs font-medium">{formatDate(post.publishedAt)}</span>
                      <h2 className="text-lg font-bold text-white leading-snug tracking-tight group-hover:text-(--color-neu-primary) transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer variant="blog" />
    </div>
  )
}
