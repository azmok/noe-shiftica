"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Masonry from "react-masonry-css";
import { BlogFallbackHero } from "./BlogFallbackHero";
import { GcsImage } from "@/lib/GcsImage";

interface BlogRecentStoriesClientProps {
    recentPosts: any[];
}

export function BlogRecentStoriesClient({ recentPosts }: BlogRecentStoriesClientProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [randomStyles, setRandomStyles] = useState<{ aspect: string, padL: number, padR: number }[]>([]);

    useEffect(() => {
        const aspectRatios = ["aspect-video", "aspect-[4/5]", "aspect-square"];

        // Generate random ratios & padding offsets on mount
        const styles = recentPosts.map(() => {
            const totalPadding = Math.random() * 32; // Max 32% "empty" space
            const leftPadding = Math.random() * totalPadding;
            const rightPadding = totalPadding - leftPadding;

            return {
                aspect: aspectRatios[Math.floor(Math.random() * aspectRatios.length)],
                padL: leftPadding,
                padR: rightPadding
            };
        });

        setRandomStyles(styles);
        setIsMounted(true);
    }, [recentPosts]);

    if (recentPosts.length === 0) return null;

    // 2-Column Impact for PC/Tablet
    const breakpointColumnsObj = {
        default: 2,
        768: 1
    };

    return (
        <section className="blog-posts mt-20 mb-32 overflow-hidden px-4 md:px-0">
            <style jsx global>{`
                .my-masonry-grid {
                    display: flex;
                    margin-left: -40px;
                    width: auto;
                }
                .my-masonry-grid_column {
                    padding-left: 40px;
                    background-clip: padding-box;
                }
                .my-masonry-grid_column > div {
                    margin-bottom: 40px;
                }
                @media (min-width: 1024px) {
                    .my-masonry-grid { margin-left: -60px; }
                    .my-masonry-grid_column { padding-left: 60px; }
                    .my-masonry-grid_column > div { margin-bottom: 60px; }
                }
            `}</style>

            <div className="flex flex-col gap-8 mb-16 md:px-2">
                <h2 className="text-base font-bold text-slate-300 uppercase tracking-[0.4em] flex items-center gap-6">
                    <span className="w-16 h-px bg-(--color-neu-primary)/40"></span>
                    Recent Stories
                </h2>
            </div>

            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="my-masonry-grid"
                columnClassName="my-masonry-grid_column"
            >
                {recentPosts.map((post: any, index: number) => {
                    const hasHero = !!(post.heroUrl || post.coverUrl);
                    const s = randomStyles[index] || { aspect: "aspect-video", padL: 0, padR: 0 };

                    // Only apply random width padding on Desktop/Tablet (>768pxish)
                    // We simulate this by checking if isMounted
                    const containerStyle = (isMounted) ? {
                        paddingLeft: `calc(env(is-mobile, 0) == 1 ? 0% : ${s.padL}%)`,
                        paddingRight: `calc(env(is-mobile, 0) == 1 ? 0% : ${s.padR}%)`,
                    } : {};

                    // Actually, let's use a cleaner approach for responsive styles in inline style
                    const itemPadding = (isMounted && typeof window !== 'undefined' && window.innerWidth > 768)
                        ? { paddingLeft: `${s.padL}%`, paddingRight: `${s.padR}%` }
                        : {};

                    if (hasHero) {
                        return (
                            <div key={post.id} style={itemPadding} className="transition-transform duration-500">
                                <Link
                                    href={`/blog/${post.slug}`}
                                    className="group relative flex flex-col items-start gap-[10px] w-full p-6 transition-all"
                                    data-cursor-magnetic="false"
                                >
                                    {/* Floating Headline */}
                                    <div className="ml-[-25px] max-w-[80%] z-20 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[5px]">
                                        <h3
                                            className="text-[14px] font-thin leading-[1.19] tracking-[1.5px] text-(--color-neu-primary) uppercase drop-shadow-[2px_2px_4px_rgba(0,0,0,0.15)] line-clamp-2"
                                            style={{
                                                WebkitTextStroke: '0.4px var(--color-neu-primary)',
                                            }}
                                        >
                                            {post.title}
                                        </h3>
                                    </div>

                                    {/* Bold border line */}
                                    <div className="w-12 h-1 bg-(--color-neu-primary) z-30 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[-5px]"></div>

                                    <div className={`w-full ${s.aspect} rounded-xl overflow-hidden bg-slate-900 shadow-2xl relative`}>
                                        <div className="w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
                                            {(() => {
                                                const preGenUrl = post.heroMediumUrl || post.coverMediumUrl;
                                                const img = preGenUrl || post.heroUrl || post.coverUrl;
                                                return (
                                                    <GcsImage
                                                        src={img}
                                                        alt={post.title}
                                                        preOptimized={!!preGenUrl}
                                                        objectFit="cover"
                                                        className="w-full h-full"
                                                    />
                                                );
                                            })()}
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                        View Article ↗
                                    </span>
                                </Link>
                            </div>
                        );
                    } else {
                        // Card Type 2: Text Only
                        return (
                            <div key={post.id} style={itemPadding} className="transition-all duration-300 hover:scale-[1.03]">
                                <Link
                                    href={`/blog/${post.slug}`}
                                    className="group relative block w-full"
                                    data-cursor-magnetic="false"
                                >
                                    <div className="w-full h-auto flex items-center justify-center py-16 px-8 bg-transparent border-t-8 border-b-8 border-(--color-neu-primary) transition-colors hover:bg-(--color-neu-primary)/5 shadow-[0_0_50px_rgba(var(--color-neu-primary-rgb),0.05)]">
                                        <h3
                                            className="text-3xl md:text-[60px] font-bold leading-[1.1] tracking-[1.1px] text-(--color-neu-primary) uppercase wrap-break-word text-center md:text-left drop-shadow-md"
                                            style={{
                                                WebkitTextStroke: '2px var(--color-neu-primary)',
                                                textShadow: '8px 8px 0px rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            {post.title}
                                        </h3>
                                    </div>
                                    <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>{post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0].replace(/-/g, '.') : ''}</span>

                                    </div>
                                </Link>
                            </div>
                        );
                    }
                })}
            </Masonry>
        </section>
    );
}
