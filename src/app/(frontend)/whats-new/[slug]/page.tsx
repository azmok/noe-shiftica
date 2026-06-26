import { getPayload } from "payload"
import configPromise from "@payload-config"
import { RichText } from "@payloadcms/richtext-lexical/react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import { Header } from "../../components/Header"
import { Footer } from "../../components/Footer"
import { ArticleJsonLd } from "../../components/ArticleJsonLd"
import { GcsImage } from "@/lib/GcsImage"
import type { WhatsNew, Media } from "@/payload-types"

const SITE_URL = "https://noe-shiftica.com"

function mediaUrl(image?: (number | null) | Media): string | null {
  if (image && typeof image === "object") return (image as Media).url || null
  return null
}

/** schema.org / OG require absolute URLs. */
function toAbsolute(url: string | null): string | null {
  if (!url) return null
  if (/^https?:\/\//.test(url)) return url
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

async function findPost(slug: string): Promise<WhatsNew | null> {
  const decoded = decodeURIComponent(slug)
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: "whats-new",
    where: { slug: { equals: decoded }, status: { equals: "published" } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  return result.docs?.[0] || null
}

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: "whats-new",
      where: { status: { equals: "published" } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })
    return result.docs.map((doc) => ({ slug: doc.slug || "" }))
  } catch (error) {
    console.error("Failed to generateStaticParams for whats-new:", error)
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  try {
    const post = await findPost(slug)
    if (!post) return {}

    const title = post.seo?.metaTitle || post.title
    const description = post.seo?.metaDescription || post.excerpt || ""
    const ogImage =
      toAbsolute(mediaUrl(post.seo?.ogImage)) || toAbsolute(mediaUrl(post.featuredImage))

    return {
      title,
      description,
      alternates: { canonical: `/whats-new/${post.slug}` },
      openGraph: {
        title,
        description,
        type: "article",
        url: `/whats-new/${post.slug}`,
        publishedTime: post.publishedAt || undefined,
        ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    }
  } catch (error) {
    console.error(`Metadata generation failed for whats-new/${slug}`, error)
    return { alternates: { canonical: `/whats-new/${decoded}` } }
  }
}

function formatDate(value?: string | null): string {
  if (!value) return ""
  return new Date(value).toISOString().split("T")[0].replace(/-/g, ".")
}

export default async function WhatsNewArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let post: WhatsNew | null = null
  try {
    post = await findPost(slug)
  } catch (error) {
    console.error(`[ISR][whats-new/${slug}] query threw — preserving stale cache:`, error)
    throw error
  }
  if (!post) notFound()

  const heroUrl = mediaUrl(post.featuredImage)
  const jsonLdImage =
    toAbsolute(mediaUrl(post.seo?.ogImage)) || toAbsolute(heroUrl)

  return (
    <div className="min-h-screen bg-background-void font-sans antialiased relative selection:bg-(--color-neu-primary)/40 overflow-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-(--color-neu-primary)/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-(--color-neu-primary)/5 blur-[100px]" />
      </div>

      <ArticleJsonLd
        title={post.title}
        path={`/whats-new/${post.slug}`}
        description={post.seo?.metaDescription || post.excerpt}
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        image={jsonLdImage}
      />

      <Header />

      <main className="grow px-4 sm:px-6 lg:px-12 pt-24 pb-24 md:pt-32 relative z-10">
        <article className="max-w-3xl mx-auto flex flex-col gap-8">
          <div>
            <Link
              href="/whats-new"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-(--color-neu-primary) transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              What&apos;s New 一覧へ
            </Link>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-(--color-neu-primary)/15 text-[11px] font-bold text-(--color-neu-primary) uppercase tracking-widest border border-(--color-neu-primary)/30">
              Product Update
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter">
              {post.title}
            </h1>
            <p className="mt-4 text-slate-400 text-sm font-medium">{formatDate(post.publishedAt)}</p>
          </div>

          {heroUrl && (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black/40">
              <GcsImage src={heroUrl} alt={post.title} priority objectFit="cover" className="w-full h-full" />
            </div>
          )}

          <div className="prose prose-invert prose-base max-w-none prose-headings:tracking-tight prose-a:text-(--color-neu-primary) prose-img:rounded-2xl prose-h4:text-[25px]">
            <RichText data={post.content} />
          </div>
        </article>
      </main>

      <Footer variant="blog" />
    </div>
  )
}
