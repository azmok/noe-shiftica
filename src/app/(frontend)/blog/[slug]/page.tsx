import React from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { BlogFallbackHero } from "../../components/BlogFallbackHero";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { RichText } from '@payloadcms/richtext-lexical/react';
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// 事前ビルド（SSG）するslugのリストを返す関数
export async function generateStaticParams() {
    try {
        const payload = await getPayload({ config: configPromise });
        const posts = await payload.find({
            collection: "posts",
            depth: 0,
            limit: 100,
            where: {
                _status: {
                    equals: 'published',
                },
            },
        });

        return posts.docs.map((post) => ({
            slug: post.slug || "",
        }));
    } catch (error) {
        console.error("Failed to generateStaticParams for blog posts (expected in some build environments):", error);
        return [];
    }
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const payload = await getPayload({ config: configPromise });

    // Fetch the post matching the slug
    const posts = await payload.find({
        collection: "posts",
        where: {
            slug: {
                equals: decodeURIComponent(slug),
            },
            _status: {
                equals: 'published',
            },
        },
        depth: 1,
        limit: 1,
    });

    if (!posts.docs || posts.docs.length === 0) {
        notFound();
    }

    const post = posts.docs[0];

    // Fetch Previous and Next posts
    let prevPost = null;
    let nextPost = null;

    if (post.publishedAt) {
        const prevPostsRes = await payload.find({
            collection: "posts",
            where: {
                publishedAt: {
                    less_than: post.publishedAt,
                },
                _status: {
                    equals: 'published',
                },
            },
            sort: '-publishedAt',
            limit: 1,
            depth: 0,
        });
        prevPost = prevPostsRes.docs[0] || null;

        const nextPostsRes = await payload.find({
            collection: "posts",
            where: {
                publishedAt: {
                    greater_than: post.publishedAt,
                },
                _status: {
                    equals: 'published',
                },
            },
            sort: 'publishedAt',
            limit: 1,
            depth: 0,
        });
        nextPost = nextPostsRes.docs[0] || null;
    }

    return (
        <div className="bg-[var(--color-neu-bg-light)] text-slate-900 min-h-screen flex flex-col font-sans antialiased relative selection:bg-[var(--color-neu-primary)] selection:text-white overflow-x-hidden">
            {/* Header contrast background */}
            <div className="absolute top-0 left-0 w-full h-[120px] bg-gradient-to-b from-slate-900/60 to-transparent pointer-events-none z-40"></div>

            <Header alwaysBackdrop={true} />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-8">
                    {/* Article Column */}
                    <article className="lg:col-span-8 lg:col-start-3 flex flex-col gap-8">

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm font-medium pl-2">
                            <Link className="text-slate-500 hover:text-[var(--color-neu-primary)] transition-colors" href="/">Home</Link>
                            <span className="text-slate-500">/</span>
                            <Link className="text-slate-500 hover:text-[var(--color-neu-primary)] transition-colors" href="/blog">Blog</Link>
                            <span className="text-slate-500">/</span>
                            <span className="text-[var(--color-neu-primary)] truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
                        </div>

                        {/* Main Article Card */}
                        <div className="neu-flat p-6 md:p-10 lg:p-12 relative overflow-hidden rounded-[2rem]">

                            {/* Title Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="neu-pressed px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[var(--color-neu-primary)]">
                                        Journal
                                    </span>
                                    {post.publishedAt && (
                                        <span className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-tight tracking-tight mb-6">
                                    {post.title}
                                </h1>

                                <p className="text-base text-slate-400 leading-relaxed max-w-2xl mb-2">
                                    ここで最新の考察やニュースをお届けします。読み進めて詳細をご確認ください。
                                </p>
                            </div>

                            {/* Hero Image / Header visual gap */}
                            <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-10 shadow-inner p-2 bg-slate-200/50">
                                <div className="w-full h-full rounded-xl overflow-hidden relative">
                                    {(() => {
                                        const img = (post.heroImage || post.coverImage);
                                        if (img && typeof img === 'object' && 'url' in img && img.url) {
                                            return (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-neu-primary)]/20 to-transparent mix-blend-overlay z-10"></div>
                                                    <div
                                                        className="w-full h-full bg-cover bg-center transform hover:scale-105 transition-transform duration-700"
                                                        style={{ backgroundImage: `url('${img.url}')` }}
                                                    ></div>
                                                </>
                                            );
                                        }
                                        return <BlogFallbackHero />;
                                    })()}
                                </div>
                            </div>

                            {/* Content Body */}
                            {/* prose-invert removed to keep text dark */}
                            <div className="prose prose-lg prose-slate max-w-none font-sans leading-relaxed text-slate-700 marker:text-[var(--color-neu-primary)] prose-a:text-[var(--color-neu-primary)] prose-a:no-underline hover:prose-a:underline prose-headings:text-slate-800 prose-strong:text-slate-900 prose-blockquote:border-l-[var(--color-neu-primary)] prose-blockquote:bg-slate-50/50 prose-blockquote:neu-pressed prose-blockquote:rounded-xl prose-blockquote:p-6 prose-blockquote:not-italic prose-blockquote:text-slate-600 prose-code:text-[var(--color-neu-primary)] prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-[''] prose-code:after:content-['']">
                                {post.content && typeof post.content === 'object' && 'root' in post.content ? (
                                    <RichText data={post.content} />
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: post.content as any }} />
                                )}
                            </div>

                            {/* Tags / Bottom Border */}
                            <div className="flex flex-wrap gap-3 mt-12 pt-8 border-t border-slate-200">
                                <span className="px-4 py-2 rounded-xl bg-[var(--color-neu-bg-light)] neu-flat text-sm font-bold text-slate-500">
                                    #Journal
                                </span>
                                <span className="px-4 py-2 rounded-xl bg-[var(--color-neu-bg-light)] neu-flat text-sm font-bold text-slate-500">
                                    #News
                                </span>
                            </div>
                        </div>

                        {/* Post Navigation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 mb-8">
                            {prevPost ? (
                                <Link href={`/blog/${prevPost.slug}`} className="neu-btn p-6 rounded-2xl group flex flex-col items-start">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-[var(--color-neu-primary)] transition-colors flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                        Previous
                                    </span>
                                    <h4 className="text-lg font-bold text-slate-700 leading-snug line-clamp-2 text-left">{prevPost.title}</h4>
                                </Link>
                            ) : (
                                <Link href="/blog" className="neu-btn p-6 rounded-2xl group flex flex-col items-start">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-[var(--color-neu-primary)] transition-colors flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                        Back to Top
                                    </span>
                                    <h4 className="text-lg font-bold text-slate-700 leading-snug text-left">Journal 一覧へ戻る</h4>
                                </Link>
                            )}

                            {nextPost ? (
                                <Link href={`/blog/${nextPost.slug}`} className="neu-btn p-6 rounded-2xl group flex flex-col items-end">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-[var(--color-neu-primary)] transition-colors flex items-center gap-1">
                                        Next
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </span>
                                    <h4 className="text-lg font-bold text-slate-700 leading-snug line-clamp-2 text-right">{nextPost.title}</h4>
                                </Link>
                            ) : (
                                <Link href="/blog" className="neu-btn p-6 rounded-2xl group flex flex-col items-end">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-[var(--color-neu-primary)] transition-colors flex items-center gap-1">
                                        Back to Top
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </span>
                                    <h4 className="text-lg font-bold text-slate-700 leading-snug text-right">Journal 一覧へ戻る</h4>
                                </Link>
                            )}
                        </div>

                    </article>
                </div>
            </main>

            <Footer variant="blog" />
        </div>
    );
}
