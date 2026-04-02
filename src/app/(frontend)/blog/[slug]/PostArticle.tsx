import React from "react"
import { Post } from "@/payload-types"
import { RichText } from "@payloadcms/richtext-lexical/react"
import Link from "next/link"
import { BlogFallbackHero } from "../../components/BlogFallbackHero"
import { GcsImage } from "@/lib/GcsImage"
import { calculateReadingTime } from "@/lib/calculateReadingTime"
import { HtmlEmbedBlock } from "@/components/HtmlEmbedBlock"
import styles from './PostArticle.module.css'

export const PostArticle: React.FC<{
    post: Post
    isPreview?: boolean
    prevPost?: Post | null
    nextPost?: Post | null
}> = ({ post, isPreview, prevPost, nextPost }) => {
    const htmlBodyHtml: string = (post as any).htmlEmbed?.bodyHtml || ''
    const readingTime =
        (post as any).readingTime ||
        calculateReadingTime(post.content) + calculateReadingTime(htmlBodyHtml) ||
        1

    return (
        <main className="grow w-full md:max-w-7xl mx-auto md:px-4 sm:px-6 lg:px-8 pt-0 md:pt-24 pb-20 md:pb-32 relative z-10">
            {isPreview && (
                <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-xl neu-flat mx-4 mt-6 md:mx-0 md:mt-0">
                    <p className="font-bold">Preview Mode</p>
                    <p className="text-sm">You are viewing a draft version of this post with live updates enabled.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

                {/* Mobile Article View */}
                <article className="selection:bg-(--color-neu-primary)/30 md:hidden flex flex-col pt-0">
                    {/* Immersive Hero */}
                    <div className="relative w-full aspect-video rounded-b-[40px] overflow-hidden shadow-2xl bg-black/40">
                        {(() => {
                            try {
                                const img = (post.heroImage || post.coverImage);
                                if (img && typeof img === 'object' && 'url' in img && img.url) {
                                    const finalUrl = img.sizes?.medium?.url || img.url;
                                    return (
                                        <GcsImage
                                            src={finalUrl}
                                            alt={post.title}
                                            priority
                                            preOptimized={!!img.sizes?.medium}
                                            objectFit="contain"
                                            className="w-full h-full object-contain"
                                        />
                                    );
                                }
                            } catch (e) {
                                console.error(`[DEBUG ERROR] HeroImage render failed for ${post.slug}:`, e);
                            }
                            return <BlogFallbackHero />;
                        })()}
                        {/* Dark Gradient Overlay for Readability */}
                        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black via-black/70 to-transparent z-10 pointer-events-none" />

                        <div className="absolute bottom-[10px] right-[10px] z-30">
                            <span className="bg-(--color-neu-primary) text-black px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest">Journal</span>
                        </div>

                        <div className="absolute bottom-[1rem] left-6 right-6 z-20">
                            <h1 className="text-3xl font-sans text-white leading-none drop-shadow-[1px_1px_1px_rgba(0,0,0,1)]">
                                {post.title}
                            </h1>

                        </div>
                    </div>

                    {/* Mobile meta data */}
                    <div className="px-6 pt-6 -mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <span className="text-(--color-neu-primary)">Published</span>
                            <span className="text-white/80">{post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0].replace(/-/g, '.') : ''}</span>
                        </div>

                        {readingTime > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-(--color-neu-primary)">読了目安</span>
                                <span className="text-white/80">{readingTime}分</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5">
                            <span className="text-(--color-neu-primary)">Author</span>
                            <span className="text-white/80">Noe Shiftica</span>
                        </div>
                    </div>
                    {/* Mobile Article Content */}
                    <div className="px-6 py-10 space-y-10">
                        {/* Key Points / Intro Card */}
                        <div className="p-6 rounded-(--mobile-radius) bg-white/5 backdrop-blur-sm border border-white/10">
                            <h2 className="text-sm font-bold text-(--color-neu-primary) uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-(--color-neu-primary) animate-pulse" />
                                Key Insights
                            </h2>
                            <p className="text-sm text-slate-300 leading-relaxed italic">
                                {post.description || "この記事の主要なポイントをまとめました。詳細については以下の本文をご覧ください。"}
                            </p>
                        </div>

                        <div className={`prose prose-sm prose-invert max-w-none font-sans ${styles.postContent}`}>

                            {(() => {
                                try {
                                    if (post.content && typeof post.content === 'object' && 'root' in post.content) {
                                        return <RichText data={post.content as any} />;
                                    } else if (post.content) {
                                        return <div dangerouslySetInnerHTML={{ __html: post.content as any }} />;
                                    }
                                } catch (e) {
                                    return <div className="p-4 bg-red-50 text-red-500 rounded">Content failed to load.</div>;
                                }
                                return null;
                            })()}
                        </div>

                        {/* HTML Embed */}
                        {(post as any).htmlEmbed?.bodyHtml && (
                            <HtmlEmbedBlock
                                bodyHtml={(post as any).htmlEmbed.bodyHtml}
                                embedCss={(post as any).htmlEmbed.embedCss ?? ''}
                                title={post.title}
                            />
                        )}

                        {/* Mobile Tags */}
                        {(() => {
                            const cmd = (post.customMetaData as Record<string, any>) || {};
                            const tags = Array.isArray(cmd.tags) ? cmd.tags : [];
                            if (tags.length === 0) return null;
                            return (
                                <div className="flex flex-wrap gap-2 pt-8 border-t border-white/10">
                                    {tags.map((tag, index) => (
                                        <span key={index} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Mobile Navigation Cards */}
                        <div className="space-y-4 pt-4">
                            <h4 className="text-xs font-bold text-(--mobile-text-muted) uppercase tracking-widest text-center mb-6">Continue Reading</h4>
                            {nextPost && (
                                <Link href={`/blog/${nextPost.slug}`} className="block">
                                    <div className="p-5 rounded-(--mobile-radius) bg-white/5 border border-white/10 flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-(--color-neu-primary) uppercase tracking-widest">Up Next</span>
                                        <h5 className="text-sm font-bold text-white line-clamp-1">{nextPost.title}</h5>
                                    </div>
                                </Link>
                            )}
                            {prevPost && (
                                <Link href={`/blog/${prevPost.slug}`} className="block">
                                    <div className="p-5 rounded-(--mobile-radius) bg-white/5 border border-white/5 opacity-80 flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-(--color-neu-primary) uppercase tracking-widest">Previous</span>
                                        <h5 className="text-sm font-bold text-slate-300 line-clamp-1">{prevPost.title}</h5>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </article>

                {/* Desktop Article Column */}
                <article className="selection:bg-(--color-neu-primary)/30 hidden md:flex lg:col-span-12 xl:col-span-12 flex-col gap-12 mt-8">
                    <div className="relative w-full">
                        {/* Vertical Breadcrumbs */}
                        <div className="absolute -left-16 top-10 origin-top-left rotate-90 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest pointer-events-none whitespace-nowrap">
                            <Link className="text-slate-400 hover:text-(--color-neu-primary) transition-colors pointer-events-auto" href="/">Home</Link>
                            <span className="text-slate-500">/</span>
                            <Link className="text-slate-400 hover:text-(--color-neu-primary) transition-colors pointer-events-auto" href="/blog">Blog</Link>
                            <span className="text-slate-500">/</span>
                            <span className="text-(--color-neu-primary) truncate max-w-[200px] drop-shadow-[0_0_8px_rgba(var(--color-neu-primary-rgb),0.3)]">{post.title}</span>
                        </div>

                        {/* Main Card */}
                        <div className="bg-white/5 border border-white/10 overflow-hidden rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
                            <div className="flex flex-col">
                                {/* Hero Image Section with Title Overlay */}
                                <div className="w-full aspect-video relative group overflow-hidden bg-black/20 border-b border-white/5">
                                    {(() => {
                                        try {
                                            const img = (post.heroImage || post.coverImage);
                                            if (img && typeof img === 'object' && 'url' in img && img.url) {
                                                const finalUrl = img.sizes?.medium?.url || img.url;
                                                return (
                                                    <div className="w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
                                                        <GcsImage
                                                            src={finalUrl}
                                                            alt={post.title}
                                                            priority
                                                            preOptimized={!!img.sizes?.medium}
                                                            objectFit="contain"
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                );
                                            }
                                        } catch (e) {
                                            console.error(`[DEBUG ERROR] Hero render failed:`, e);
                                        }
                                        return <BlogFallbackHero />;
                                    })()}

                                    {/* Dark Gradient Overlay */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />

                                    {/* Title Overlay: White text + White glow shadow */}
                                    <div className="absolute inset-x-12 bottom-12 lg:inset-x-20 lg:bottom-20 z-20">
                                        <h1 className="text-white text-4xl lg:text-5xl xl:text-7xl font-sans font-bold leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                                            {post.title}
                                        </h1>
                                    </div>
                                </div>

                                {/* Metadata Section (Below Hero) */}
                                <div className="p-8 lg:px-20 lg:py-10 border-b border-white/5 bg-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-(--color-neu-primary) bg-(--color-neu-primary)/5 px-3 py-1 rounded-sm">
                                                Journal
                                            </span>
                                            <div className="flex flex-col gap-1">
                                                {post.publishedAt && (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white/70 text-[14px] font-normal flex items-center gap-1.5">
                                                            {new Date(post.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </span>
                                                        {readingTime > 0 && (
                                                            <>
                                                                <span className="text-white/30">|</span>
                                                                <span className="text-white/70 text-[14px] font-normal flex items-center gap-1.5">
                                                                    読了目安: {readingTime}分
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                {post.updatedAt && post.publishedAt && new Date(post.updatedAt).getTime() > new Date(post.publishedAt).getTime() && (
                                                    <span className="text-white/50 text-[12px] font-normal">
                                                        最終更新: {new Date(post.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="max-w-[872px] mx-auto w-full px-6 lg:px-12 py-16 lg:py-12 lg:pb-24 text-white">
                                    <div className={`prose prose-lg prose-invert max-w-none font-sans ${styles.postContent}`}>

                                        {(() => {
                                            try {
                                                if (post.content && typeof post.content === 'object' && 'root' in post.content) {
                                                    return <RichText data={post.content as any} />;
                                                } else if (post.content) {
                                                    return <div dangerouslySetInnerHTML={{ __html: post.content as any }} />;
                                                }
                                            } catch (e) {
                                                // fail
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {(post as any).htmlEmbed?.bodyHtml && (
                                        <HtmlEmbedBlock
                                            bodyHtml={(post as any).htmlEmbed.bodyHtml}
                                            embedCss={(post as any).htmlEmbed.embedCss ?? ''}
                                            title={post.title}
                                        />
                                    )}

                                    {/* Desktop Tags */}
                                    {(() => {
                                        const cmd = (post.customMetaData as Record<string, any>) || {};
                                        const tags = Array.isArray(cmd.tags) ? cmd.tags : [];
                                        if (tags.length === 0) return null;
                                        return (
                                            <div className="flex flex-wrap gap-3 mt-16 pt-10 border-t border-white/10">
                                                {tags.map((tag, index) => (
                                                    <Link
                                                        key={index}
                                                        href={`/blog/tag/${tag}`}
                                                        className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] font-medium text-slate-400 hover:text-(--color-neu-primary) hover:border-(--color-neu-primary)/30 transition-all"
                                                    >
                                                        #{tag}
                                                    </Link>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                        {prevPost ? (
                            <Link href={`/blog/${prevPost.slug}`} className="bg-white/5 border border-white/10 p-8 rounded-2xl group flex flex-col items-start transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 backdrop-blur-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-(--color-neu-primary) transition-colors flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Previous
                                </span>
                                <h4 className="text-lg font-bold text-white leading-snug line-clamp-2 text-left group-hover:text-(--color-neu-primary) transition-colors">{prevPost.title}</h4>
                            </Link>
                        ) : (
                            <Link href="/blog" className="bg-white/5 border border-white/10 p-8 rounded-2xl group flex flex-col items-start transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 backdrop-blur-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-(--color-neu-primary) transition-colors flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Back to Journal
                                </span>
                                <h4 className="text-lg font-bold text-white leading-snug text-left group-hover:text-(--color-neu-primary) transition-colors">一覧をチェック</h4>
                            </Link>
                        )}

                        {nextPost ? (
                            <Link href={`/blog/${nextPost.slug}`} className="bg-white/5 border border-white/10 p-8 rounded-2xl group flex flex-col items-end transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 backdrop-blur-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-(--color-neu-primary) transition-colors flex items-center gap-1">
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </span>
                                <h4 className="text-lg font-bold text-white leading-snug line-clamp-2 text-right group-hover:text-(--color-neu-primary) transition-colors">{nextPost.title}</h4>
                            </Link>
                        ) : (
                            <Link href="/blog" className="bg-white/5 border border-white/10 p-8 rounded-2xl group flex flex-col items-end transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 backdrop-blur-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-(--color-neu-primary) transition-colors flex items-center gap-1">
                                    Back to Journal
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </span>
                                <h4 className="text-lg font-bold text-white leading-snug text-right group-hover:text-(--color-neu-primary) transition-colors">一覧をチェック</h4>
                            </Link>
                        )}
                    </div>
                </article>
            </div>
        </main>
    )
}
