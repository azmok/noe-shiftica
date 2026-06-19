import React from "react";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { BlogRecentStoriesClient } from "../../../components/BlogRecentStoriesClient";
import Link from "next/link";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { notFound } from "next/navigation";
import Script from "next/script";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ tag: string }>;
}) {
    const { tag } = await params;
    const decodedTag = typeof tag === 'string' ? decodeURIComponent(tag) : '';
    return {
        // Self-referencing canonical. Without this, the page inherits the root
        // layout's `canonical: "/"` and looks like a duplicate of the homepage.
        alternates: {
            canonical: `/blog/tag/${encodeURIComponent(decodedTag)}`,
        },
    };
}

export default async function TagPage({
    params,
}: {
    params: Promise<{ tag: string }>;
}) {
    const { tag } = await params;
    const decodedTag = typeof tag === 'string' ? decodeURIComponent(tag) : '';
    const payload = await getPayload({ config: configPromise });

    // Fetch published posts and filter by tag in-memory 
    // to avoid Payload/Postgres JSON path query compatibility issues
    const postsRes = await payload.find({
        collection: "posts",
        where: {
            _status: {
                equals: 'published',
            },
        },
        sort: '-publishedAt',
        limit: 1000,
        depth: 1,
    });

    const posts = postsRes.docs.filter((post) => {
        const meta = post.customMetaData as Record<string, any> | undefined;
        if (meta && Array.isArray(meta.tags)) {
            // Case-insensitive match for tags
            return meta.tags.some((t: any) =>
                String(t).toLowerCase() === decodedTag.toLowerCase()
            );
        }
        return false;
    });

    // Map Payload Post type to PostSummary-like shape for BlogRecentStoriesClient
    const mappedPosts = posts.map(post => {
        const hero = post.heroImage && typeof post.heroImage === 'object' ? post.heroImage : null;
        const cover = post.coverImage && typeof post.coverImage === 'object' ? post.coverImage : null;

        return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            description: post.description,
            publishedAt: post.publishedAt,
            // Extract URLs from Payload relationship objects
            heroUrl: hero?.url || null,
            heroThumbnailUrl: (hero as any)?.sizes?.thumbnail?.url || null,
            heroMediumUrl: (hero as any)?.sizes?.medium?.url || null,
            coverUrl: cover?.url || null,
            coverThumbnailUrl: (cover as any)?.sizes?.thumbnail?.url || null,
            coverMediumUrl: (cover as any)?.sizes?.medium?.url || null,
        };
    });

    return (
        <div className="min-h-screen bg-background-void font-sans antialiased relative selection:bg-(--color-neu-primary)/40 overflow-hidden flex flex-col">
            {/* Premium Depth Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Mesh Gradient Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-(--color-neu-primary)/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-(--color-neu-primary)/5 blur-[100px]" />
                <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] rounded-full bg-blue-500/5 blur-[80px]" />

                {/* SVG Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ filter: 'url(#noiseFilterDetail)' }}></div>
            </div>

            <Header />

            <main className="grow px-4 sm:px-6 lg:px-40 pt-14 pb-16 md:pt-28 md:pb-32 relative z-10 transition-colors duration-500">
                <div className="max-w-[960px] mx-auto flex flex-col gap-10 mt-2 md:mt-8">

                    <div className="flex flex-col gap-4 mb-4">
                        <Link href="/blog" className="text-slate-500 hover:text-(--color-neu-primary) transition-colors flex items-center gap-2 text-sm font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Blog
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-black text-white">
                            Tag: <span className="text-(--color-neu-primary)">#{decodedTag}</span>
                        </h1>
                        <p className="text-slate-400">
                            {mappedPosts.length} {mappedPosts.length === 1 ? 'article' : 'articles'} found
                        </p>
                    </div>

                    {mappedPosts.length === 0 ? (
                        <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl w-full backdrop-blur-sm">
                            <h3 className="text-2xl font-bold mb-4 text-white">
                                No articles found for this tag
                            </h3>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                このタグに関連付けられた公開記事はまだありません。
                            </p>
                            <Link
                                href="/blog"
                                className="text-(--color-neu-primary) font-bold hover:underline transition-colors"
                            >
                                全ての記事を見る
                            </Link>
                        </div>
                    ) : (
                        <BlogRecentStoriesClient recentPosts={mappedPosts} />
                    )}
                </div>
            </main>

            <Footer variant="blog" />

            {/* SVG Global Filters */}
            <svg className="hidden">
                <filter id="noiseFilterDetail">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
            </svg>

            {/* GLOBAL FAILSAFE: Force visibility for any images stuck at opacity: 0 */}
            <Script
                id="force-image-visibility-tag"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        (function() {
                            const forceImages = () => {
                                document.querySelectorAll('img').forEach(img => {
                                    try {
                                        if (img.closest('.hidden')) return;
                                        const inlineStyle = img.style.opacity;
                                        const computedStyle = window.getComputedStyle(img);
                                        if (inlineStyle === '0' || computedStyle.opacity === '0') {
                                            img.style.removeProperty('opacity');
                                            img.style.setProperty('opacity', '1', 'important');
                                            img.style.setProperty('visibility', 'visible', 'important');
                                            img.classList.add('is-forced-loaded');
                                        }
                                    } catch (e) {}
                                });
                            };
                            forceImages();
                            window.addEventListener('load', forceImages);
                            window.addEventListener('pageshow', forceImages);
                            const interval = setInterval(forceImages, 1000);
                            setTimeout(() => clearInterval(interval), 8000);
                        })();
                    `
                }}
            />
        </div>
    );
}
