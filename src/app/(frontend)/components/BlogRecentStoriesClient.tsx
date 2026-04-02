"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BlogFallbackHero } from "./BlogFallbackHero";
import { GcsImage } from "@/lib/GcsImage";

interface BlogRecentStoriesClientProps {
    recentPosts: any[];
}

export function BlogRecentStoriesClient({ recentPosts }: BlogRecentStoriesClientProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (recentPosts.length === 0) return null;

    return (
        <section className="mt-20 mb-32 overflow-hidden px-4 md:px-0">
            <div className="flex flex-col gap-6 mb-16 md:px-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
                    <span className="w-12 h-px bg-slate-300"></span>
                    Recent Stories
                </h2>
            </div>

            {/* Asymmetrical Swiss-style Layout */}
            <div className="flex flex-col md:flex-row flex-wrap items-center md:items-start justify-center md:justify-around gap-12 md:gap-x-12 md:gap-y-24 lg:gap-x-20 lg:gap-y-40">
                {recentPosts.map((post: any, index: number) => {
                    const hasHero = !!(post.heroUrl || post.coverUrl);
                    
                    // Swiss-style asymmetrical offsets (only on desktop)
                    const offsetClass = index % 2 === 0 ? "md:mt-0" : "md:mt-32";
                    const alignClass = index % 3 === 0 ? "md:self-start" : index % 3 === 1 ? "md:self-center" : "md:self-end";

                    if (hasHero) {
                        // Card Type 1: Image Only (420x300)
                        return (
                            <Link 
                                href={`/blog/${post.slug}`} 
                                key={post.id} 
                                className={`group relative block w-full max-w-[420px] md:w-[420px] ${offsetClass} ${alignClass} shrink-0 transition-transform duration-500 hover:-translate-y-2`}
                            >
                                <div className="w-full h-[300px] overflow-hidden bg-slate-100 shadow-2xl relative border border-slate-100">
                                    {(() => {
                                        const preGenUrl = post.heroMediumUrl || post.coverMediumUrl;
                                        const img = preGenUrl || post.heroUrl || post.coverUrl;
                                        return (
                                            <GcsImage
                                                src={img}
                                                alt={post.title}
                                                preOptimized={!!preGenUrl}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        );
                                    })()}
                                    {/* Subtle overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                </div>
                                <span className="absolute -bottom-6 left-0 text-[10px] font-bold text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Article ↗
                                </span>
                            </Link>
                        );
                    } else {
                        // Card Type 2: Text Only (600x240) - Swiss Typography
                        return (
                            <Link 
                                href={`/blog/${post.slug}`} 
                                key={post.id} 
                                className={`group relative block w-full max-w-[600px] md:w-[600px] ${offsetClass} ${alignClass} shrink-0 transition-all duration-300`}
                            >
                                <div className="w-full h-auto md:h-[240px] flex items-center justify-center p-4 md:p-8 bg-transparent border-t-4 border-b-4 border-(--color-neu-primary) transition-colors hover:bg-(--color-neu-primary)/5">
                                    <h3 
                                        className="text-4xl md:text-[92px] font-black leading-[0.85] text-(--color-neu-primary) uppercase tracking-tighter break-words text-center md:text-left drop-shadow-sm"
                                        style={{ 
                                            WebkitTextStroke: '1px var(--color-neu-primary)',
                                            textShadow: '4px 4px 0px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        {post.title}
                                    </h3>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>{post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0].replace(/-/g, '.') : ''}</span>
                                    <span className="group-hover:text-(--color-neu-primary) transition-colors">Noe Shiftica Journal</span>
                                </div>
                            </Link>
                        );
                    }
                })}
            </div>
        </section>
    );
}
