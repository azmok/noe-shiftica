"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BlogFallbackHero } from "./BlogFallbackHero";
import { GcsImage } from "@/lib/GcsImage";

interface BlogRecentStoriesClientProps {
    recentPosts: any[];
}

export function BlogRecentStoriesClient({ recentPosts }: BlogRecentStoriesClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

            <div className={
                viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    : "flex flex-col gap-6"
            }>
                {recentPosts.map((post: any) => (
                    <Link href={`/blog/${post.slug}`} key={post.id} className="block group font-sans blog-posts">
                        {viewMode === "grid" ? (
                            <article className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-4 relative transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-1 h-full">
                                <div className="aspect-[4/3] w-full rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100/50">
                                    {(() => {
                                        // Use medium-sized variant for grid cards if available, fall back to original
                                        const img = (post.heroMediumUrl || post.heroUrl || post.coverMediumUrl || post.coverUrl);
                                        if (img) {
                                            return (
                                                <GcsImage
                                                    src={img}
                                                    alt={post.title}
                                                    className="group-hover:scale-110"
                                                />
                                            );
                                        }
                                        return <BlogFallbackHero />;
                                    })()}
                                </div>
                                <div className="flex flex-col flex-1 px-1 pb-1">
                                    <span className="text-[10px] font-bold text-(--color-neu-primary) mb-2 uppercase tracking-widest">Journal</span>
                                    <h3 className="text-lg font-bold text-slate-800 leading-snug mb-2 group-hover:text-(--color-neu-primary) transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                                        {post.description || ""}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ja-JP') : ''}
                                        </span>
                                        <span className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:translate-x-1 transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ) : (
                            <article className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-6 relative transition-all duration-300 hover:shadow-md hover:translate-x-1">
                                <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100/50">
                                    {(() => {
                                        // Use thumbnail variant for list view small images
                                        const img = (post.heroThumbnailUrl || post.heroUrl || post.coverThumbnailUrl || post.coverUrl);
                                        if (img) {
                                            return (
                                                <GcsImage
                                                    src={img}
                                                    alt={post.title}
                                                    className="group-hover:scale-110"
                                                />
                                            );
                                        }
                                        return <BlogFallbackHero />;
                                    })()}
                                </div>
                                <div className="flex flex-col justify-center flex-1 pr-6">
                                    <div className="flex items-center gap-4 mb-1">
                                        <span className="text-[10px] font-bold text-(--color-neu-primary) uppercase tracking-widest">Journal</span>
                                        <span className="text-[11px] text-slate-400">
                                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ja-JP') : ''}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-(--color-neu-primary) transition-colors">
                                        {post.title}
                                    </h3>
                                </div>
                                <div className="flex items-center">
                                    <span className="size-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
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
