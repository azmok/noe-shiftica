import React from "react";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { BlogRecentStoriesClient } from "../../../components/BlogRecentStoriesClient";
import Link from "next/link";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { notFound } from "next/navigation";

export default async function TagPage({
    params,
}: {
    params: Promise<{ tag: string }>;
}) {
    const { tag } = await params;
    const decodedTag = typeof tag === 'string' ? decodeURIComponent(tag) : '';
    const payload = await getPayload({ config: configPromise });

    // Fetch posts where customMetaData.tags contains the tag
    // We use depth: 1 to get image data
    const postsRes = await payload.find({
        collection: "posts",
        where: {
            and: [
                {
                    _status: {
                        equals: 'published',
                    },
                },
                {
                    'customMetaData.tags': {
                        contains: decodedTag,
                    },
                },
            ],
        },
        sort: '-publishedAt',
        limit: 100,
        depth: 1,
    });

    const posts = postsRes.docs;

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
        <div className="bg-(--color-neu-bg-light) text-slate-900 min-h-screen flex flex-col font-sans antialiased relative selection:bg-(--color-neu-primary) selection:text-white">
            <Header />

            <main className="grow px-4 sm:px-6 lg:px-40 pt-14 pb-16 md:pt-28 md:pb-32 relative z-10">
                <div className="max-w-[960px] mx-auto flex flex-col gap-10 mt-2 md:mt-8">

                    <div className="flex flex-col gap-4 mb-4">
                        <Link href="/blog" className="text-slate-500 hover:text-(--color-neu-primary) transition-colors flex items-center gap-2 text-sm font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Blog
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800">
                            Tag: <span className="text-(--color-neu-primary)">#{decodedTag}</span>
                        </h1>
                        <p className="text-slate-500">
                            {mappedPosts.length} {mappedPosts.length === 1 ? 'article' : 'articles'} found
                        </p>
                    </div>

                    {mappedPosts.length === 0 ? (
                        <div className="text-center p-12 neu-flat rounded-2xl w-full">
                            <h3 className="text-2xl font-bold mb-4 text-slate-800">
                                No articles found for this tag
                            </h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                このタグに関連付けられた公開記事はまだありません。
                            </p>
                            <Link
                                href="/blog"
                                className="text-[var(--color-neu-primary)] font-bold hover:underline transition-colors"
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
        </div>
    );
}
