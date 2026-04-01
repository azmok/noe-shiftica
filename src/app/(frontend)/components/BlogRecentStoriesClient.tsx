"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BlogFallbackHero } from "./BlogFallbackHero";
import { GcsImage } from "@/lib/GcsImage";

interface BlogRecentStoriesClientProps {
    recentPosts: any[];
}

export function BlogRecentStoriesClient({ recentPosts }: BlogRecentStoriesClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    
    useEffect(() => {
        if (window.innerWidth < 768) {
            setViewMode("list");
        }
    }, []);

    if (recentPosts.length === 0) return null;

    return (
        <section className="mt-8">
            <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-2xl font-bold text-slate-800">Recent Stories</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`size-10 rounded-full flex items-center justify-center transition-all ${viewMode === "grid"
                            ? "bg-slate-900 text-white shadow-md"
                            : "bg-white border border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-900"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`size-10 rounded-full flex items-center justify-center transition-all ${viewMode === "list"
                            ? "bg-slate-900 text-white shadow-md"
                            : "bg-white border border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-900"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                    </button>
                </div>
            </div>

            <div className={`md:hidden ${viewMode === 'list' ? 'flex flex-col' : 'hidden'} gap-5 mt-4`}>
                <div className="flex flex-col gap-4">
                    {recentPosts.map((post: any) => (
                        <Link href={`/blog/${post.slug}`} key={post.id} className="block group">
                            <article className="bg-(--mobile-surface) shadow-(--mobile-shadow-soft) rounded-(--mobile-radius) p-3 flex gap-4 transition-all active:scale-[0.98]">
                                <div className="w-20 h-20 flex-shrink-0 rounded-(--mobile-radius-sm) overflow-hidden relative shadow-(--mobile-shadow-inset) bg-(--mobile-surface)">
                                    {(() => {
                                        const img = post.heroThumbnailUrl || post.coverThumbnailUrl || post.heroUrl || post.coverUrl;
                                        if (img) {
                                            return (
                                                <GcsImage
                                                    src={img}
                                                    alt={post.title}
                                                    preOptimized={true}
                                                    sizes="80px"
                                                    objectFit="contain"
                                                    className="w-full h-full object-cover"
                                                />
                                            );
                                        }
                                        return <BlogFallbackHero />;
                                    })()}
                                </div>
                                <div className="flex flex-col justify-between flex-1 py-0.5">
                                    <h3 className="text-sm font-bold text-(--mobile-text-primary) line-clamp-2 leading-tight">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-(--mobile-text-muted) font-sans">
                                            {post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0].replace(/-/g, '.') : ''}
                                        </span>
                                        <div className="w-7 h-7 rounded-full bg-(--mobile-surface) shadow-(--mobile-shadow-soft) flex items-center justify-center text-(--mobile-text-muted)">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m9 18 6-6-6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>

            <div className={
                `${viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    : "hidden md:flex flex-col gap-6"}`
            }>
                {recentPosts.map((post: any) => (
                    <Link href={`/blog/${post.slug}`} key={post.id} className="block group font-sans blog-posts">
                        {viewMode === "grid" ? (
                            <article className="border boder-solid border-slate-400 bg-white rounded-2xl p-4 flex flex-col gap-4 relative transition-all hover:shadow-xl duration-300 hover:-translate-y-0.5 h-full">
                                <div className="aspect-[4/3] w-full rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100/50">
                                    {(() => {
                                        // Prefer Payload pre-generated thumbnail (400x300) to skip /_next/image proxy
                                        const preGenUrl = post.heroThumbnailUrl || post.coverThumbnailUrl;
                                        const img = preGenUrl || post.heroMediumUrl || post.heroUrl || post.coverMediumUrl || post.coverUrl;
                                        if (img) {
                                            return (
                                                <GcsImage
                                                    src={img}
                                                    alt={post.title}
                                                    preOptimized={!!preGenUrl}
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                                                    objectFit="contain"
                                                    className="group-hover:scale-110"
                                                />
                                            );
                                        }
                                        return <BlogFallbackHero />;
                                    })()}
                                </div>
                                <div className="flex flex-col flex-1 px-1 pb-1">
                                    {/* <span className="text-[10px] font-bold text-(--color-neu-primary) mb-2 uppercase tracking-widest">Journal</span> */}
                                    <h3 className="text-lg font-bold text-slate-800 leading-snug mb-2 transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                                        {post.description || ""}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            {post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0].replace(/-/g, '.') : ''}
                                        </span>
                                        <span className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:translate-x-1 transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ) : (
                            <article className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-6 relative transition-all duration-300 hover:shadow-md hover:translate-x-1">
                                <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100/50">
                                    {(() => {
                                        // Thumbnail (400x300) is already the right size, serve directly from GCS CDN
                                        const preGenUrl = post.heroThumbnailUrl || post.coverThumbnailUrl;
                                        const img = preGenUrl || post.heroUrl || post.coverUrl;
                                        if (img) {
                                            return (
                                                <GcsImage
                                                    src={img}
                                                    alt={post.title}
                                                    preOptimized={!!preGenUrl}
                                                    sizes="96px"
                                                    objectFit="contain"
                                                    className="group-hover:scale-110"
                                                />
                                            );
                                        }
                                        return <BlogFallbackHero />;
                                    })()}
                                </div>
                                <div className="flex flex-col justify-center flex-1 pr-6">
                                    <div className="flex items-center gap-4 mb-1">
                                        {/* <span className="text-[10px] font-bold text-(--color-neu-primary) uppercase tracking-widest">Journal</span> */}
                                        <span className="text-[11px] text-slate-400">
                                            {post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0].replace(/-/g, '.') : ''}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 transition-colors">
                                        {post.title}
                                    </h3>
                                </div>
                                <div className="flex items-center">
                                    <span className="size-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </span>
                                </div>
                            </article>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    );
}
