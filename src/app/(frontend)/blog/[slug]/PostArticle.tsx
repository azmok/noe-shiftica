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
        <main className="post-main grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 md:pt-24 md:pb-32 relative z-10">
            {isPreview && (
                <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-xl neu-flat">
                    <p className="font-bold">Preview Mode</p>
                    <p className="text-sm">You are viewing a draft version of this post with live updates enabled.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mt-2 md:mt-8">
                {/* Article Column */}
                <article className="lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3 flex flex-col gap-12">

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

                        {/* Hero Image / Header visual gap */}
                        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-inner p-2 bg-slate-100">
                            <div className="w-full h-full rounded-xl overflow-hidden relative group">
                                {(() => {
                                    const img = (post.heroImage || post.coverImage);
                                    if (img && typeof img === 'object' && 'url' in img && img.url) {
                                        const largeUrl = img.sizes?.large?.url;
                                        const finalUrl = largeUrl || img.url;
                                        return (
                                            <>
                                                <div className="absolute inset-0 bg-linear-to-tr from-(--color-neu-primary)/10 to-transparent mix-blend-overlay z-10 pointer-events-none"></div>
                                                <GcsImage
                                                    src={finalUrl}
                                                    alt={post.title}
                                                    priority
                                                    preOptimized={!!largeUrl}
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

                        {/* Tags / Bottom Border */}
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

                    {/* Post Navigation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4 mb-8">
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
