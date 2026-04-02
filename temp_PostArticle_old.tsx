import React from "react"
import { Post } from "@/payload-types"
import { RichText } from "@payloadcms/richtext-lexical/react"
import Link from "next/link"
import { BlogFallbackHero } from "../../components/BlogFallbackHero"
import { GcsImage } from "@/lib/GcsImage"
import { calculateReadingTime } from "@/lib/calculateReadingTime"

export const PostArticle: React.FC<{
    post: Post
    isPreview?: boolean
    prevPost?: Post | null
    nextPost?: Post | null
}> = ({ post, isPreview, prevPost, nextPost }) => {
    const readingTime = (post as any).readingTime || calculateReadingTime(post.content);

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
                <article className="md:hidden flex flex-col pt-0">
                    {/* Immersive Hero */}
                    <div className="relative w-full aspect-square sm:aspect-video rounded-b-[40px] overflow-hidden shadow-(--mobile-shadow-out) bg-(--mobile-surface)">
                        {(() => {
                            const img = (post.heroImage || post.coverImage);
                            if (img && typeof img === 'object' && 'url' in img && img.url) {
                                return (
                                    <GcsImage
                                        src={img.url}
                                        alt={post.title}
                                        priority
                                        className="w-full h-full object-cover"
                                    />
                                );
                            }
                            return <BlogFallbackHero />;
                        })()}
                        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/90" />
                        
                        <div className="absolute top-16 left-6 right-6">
                            <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">
                                <span className="bg-(--color-neu-primary) text-black px-2 py-0.5 rounded-sm">Journal</span>
                                <span>•</span>
                                <span>{readingTime} min read</span>
                            </div>
                        </div>

                        <div className="absolute bottom-10 left-6 right-6">
                            <h1 className="text-3xl font-serif text-white leading-tight mb-4 drop-shadow-lg">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-3 text-white/60 text-xs">
                                <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ja-JP') : ''}</span>
                                <span className="w-1 h-1 rounded-full bg-white/40" />
                                <span>Noe Shiftica Editorial</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-10 space-y-10">
                        {/* Key Points / Intro Card */}
                        <div className="p-6 rounded-(--mobile-radius) bg-(--mobile-surface) shadow-(--mobile-shadow-inset) border border-white/5">
                            <h2 className="text-sm font-bold text-(--color-neu-primary) uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-(--color-neu-primary) animate-pulse" />
                                Key Insights
                            </h2>
                            <p className="text-sm text-(--mobile-text-secondary) leading-relaxed italic">
                                {post.description || "この記事の主要なポイントをまとめました。詳細については以下の本文をご覧ください。"}
                            </p>
                        </div>

                        {/* Content Body */}
                        <div className="prose prose-sm prose-invert post-content-body max-w-none font-sans leading-relaxed 
                            prose-headings:font-serif
                            prose-headings:text-(--mobile-text-primary)
                            prose-p:text-(--mobile-text-secondary)
                            prose-p:text-base
                            prose-a:text-(--color-neu-primary)
                            prose-strong:text-(--mobile-text-primary)
                            prose-blockquote:border-l-3
                            prose-blockquote:border-(--color-neu-primary)
                            prose-blockquote:bg-white/5
                            prose-blockquote:rounded-lg
                            prose-blockquote:px-4
                            prose-blockquote:py-2
                            prose-img:rounded-(--mobile-radius-sm)
                            prose-img:shadow-lg
                        ">
                            {post.content && typeof post.content === 'object' && 'root' in post.content ? (
                                <RichText data={post.content as any} />
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: post.content as any }} />
                            )}
                        </div>

                        {/* Mobile Tags */}
                        {(() => {
                            const cmd = (post.customMetaData as Record<string, any>) || {};
                            const tags = Array.isArray(cmd.tags) ? cmd.tags : [];
                            if (tags.length === 0) return null;
                            return (
                                <div className="flex flex-wrap gap-2 pt-8 border-t border-white/10">
                                    {tags.map((tag, index) => (
                                        <span key={index} className="px-4 py-1.5 rounded-full bg-(--mobile-surface) shadow-(--mobile-shadow-soft) text-[10px] font-bold text-(--mobile-text-muted)">
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
                                    <div className="p-5 rounded-(--mobile-radius) bg-(--mobile-surface) shadow-(--mobile-shadow-soft) flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-(--color-neu-primary) uppercase tracking-widest">Up Next</span>
                                        <h5 className="text-sm font-bold text-(--mobile-text-primary) line-clamp-1">{nextPost.title}</h5>
                                    </div>
                                </Link>
                            )}
                            {prevPost && (
                                <Link href={`/blog/${prevPost.slug}`} className="block">
                                    <div className="p-5 rounded-(--mobile-radius) bg-(--mobile-surface) shadow-(--mobile-shadow-soft) opacity-80 flex flex-col gap-2 border border-black/5">
                                        <span className="text-[10px] font-bold text-(--mobile-text-muted) uppercase tracking-widest">Previous</span>
                                        <h5 className="text-sm font-bold text-(--mobile-text-secondary) line-clamp-1">{prevPost.title}</h5>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </article>

                {/* Desktop Article Column */}
                <article className="hidden md:flex lg:col-span-12 xl:col-span-10 xl:col-start-2 flex-col gap-12 mt-8">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm font-medium pl-2">
                        <Link className="text-slate-500 hover:text-(--color-neu-primary) transition-colors" href="/">Home</Link>
                        <span className="text-slate-500">/</span>
                        <Link className="text-slate-500 hover:text-(--color-neu-primary) transition-colors" href="/blog">Blog</Link>
                        <span className="text-slate-500">/</span>
                        <span className="text-(--color-neu-primary) truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
                    </div>

                    {/* Main Article Card */}
                    <div className="bg-white border border-slate-100 p-6 md:p-12 lg:p-16 relative overflow-hidden rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.05)]">

                        {/* Title Section */}
                        <div className="mb-10">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="bg-(--color-neu-primary)/10 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-(--color-neu-primary)">
                                    Journal
                                </span>
                                {post.publishedAt && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {new Date(post.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        {readingTime > 0 && (
                                            <>
                                                <span className="text-slate-200">|</span>
                                                <span className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z" /></svg>
                                                    読了目安: {readingTime}分
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <h1 className="post-title">
                                {post.title}
                            </h1>
                        </div>

                        {/* Hero Image */}
                        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-inner p-2 bg-slate-100">
                            <div className="w-full h-full rounded-xl overflow-hidden relative group">
                                {(() => {
                                    const img = (post.heroImage || post.coverImage);
                                    if (img && typeof img === 'object' && 'url' in img && img.url) {
                                        const finalUrl = img.sizes?.large?.url || img.url;
                                        return (
                                            <>
                                                <div className="absolute inset-0 bg-linear-to-tr from-(--color-neu-primary)/10 to-transparent mix-blend-overlay z-10 pointer-events-none"></div>
                                                <GcsImage
                                                    src={finalUrl}
                                                    alt={post.title}
                                                    priority
                                                    preOptimized={!!img.sizes?.large}
                                                    className="group-hover:scale-105"
                                                />
                                            </>
                                        );
                                    }
                                    return <BlogFallbackHero />;
                                })()}
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="prose prose-lg post-content-body max-w-none font-sans leading-relaxed 
                            marker:text-(--color-neu-primary) 
                            prose-headings:text-slate-800 
                            prose-strong:text-slate-900 
                            prose-blockquote:border-l-4 prose-blockquote:border-(--color-neu-primary) 
                            prose-blockquote:bg-slate-50/50 prose-blockquote:neu-pressed 
                            prose-blockquote:rounded-xl prose-blockquote:p-6 prose-blockquote:not-italic 
                            prose-blockquote:text-slate-600 
                            prose-code:text-(--color-neu-primary) prose-code:bg-slate-100 
                            prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md 
                            prose-code:before:content-[''] prose-code:after:content-['']
                            prose-a:text-(--color-neu-primary) 
                            prose-a:no-underline 
                            prose-a:font-bold
                            prose-a:relative 
                            prose-a:transition-all
                            hover:prose-a:text-(--color-neu-primary)/80
                        ">
                            {post.content && typeof post.content === 'object' && 'root' in post.content ? (
                                <RichText data={post.content as any} />
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: post.content as any }} />
                            )}
                        </div>

                        {/* Tags */}
                        {(() => {
                            const cmd = (post.customMetaData as Record<string, any>) || {};
                            const tags = Array.isArray(cmd.tags) ? cmd.tags : [];
                            if (tags.length === 0) return null;
                            return (
                                <div className="flex flex-wrap gap-3 mt-16 pt-10 border-t border-slate-100">
                                    {tags.map((tag, index) => (
                                        <Link
                                            key={index}
                                            href={`/blog/tag/${tag}`}
                                            className="px-4 py-2 rounded-xl bg-(--color-neu-bg-light) neu-flat text-sm font-bold text-slate-400 hover:text-(--color-neu-primary) hover:scale-105 transition-all"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Navigation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                        {prevPost ? (
                            <Link href={`/blog/${prevPost.slug}`} className="bg-white border border-slate-100 p-8 rounded-2xl group flex flex-col items-start transition-all hover:shadow-lg hover:-translate-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-(--color-neu-primary) transition-colors flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Previous
                                </span>
                                <h4 className="text-lg font-bold text-slate-800 leading-snug line-clamp-2 text-left group-hover:text-(--color-neu-primary) transition-colors">{prevPost.title}</h4>
                            </Link>
                        ) : (
                            <Link href="/blog" className="bg-white border border-slate-100 p-8 rounded-2xl group flex flex-col items-start transition-all hover:shadow-lg hover:-translate-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-(--color-neu-primary) transition-colors flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Back to Journal
                                </span>
                                <h4 className="text-lg font-bold text-slate-800 leading-snug text-left group-hover:text-(--color-neu-primary) transition-colors">一覧をチェック</h4>
                            </Link>
                        )}

                        {nextPost ? (
                            <Link href={`/blog/${nextPost.slug}`} className="bg-white border border-slate-100 p-8 rounded-2xl group flex flex-col items-end transition-all hover:shadow-lg hover:-translate-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-(--color-neu-primary) transition-colors flex items-center gap-1">
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </span>
                                <h4 className="text-lg font-bold text-slate-800 leading-snug line-clamp-2 text-right group-hover:text-(--color-neu-primary) transition-colors">{nextPost.title}</h4>
                            </Link>
                        ) : (
                            <Link href="/blog" className="bg-white border border-slate-100 p-8 rounded-2xl group flex flex-col items-end transition-all hover:shadow-lg hover:-translate-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-(--color-neu-primary) transition-colors flex items-center gap-1">
                                    Back to Journal
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </span>
                                <h4 className="text-lg font-bold text-slate-800 leading-snug text-right group-hover:text-(--color-neu-primary) transition-colors">一覧をチェック</h4>
                            </Link>
                        )}
                    </div>
                </article>
            </div>
        </main>
    )
}
