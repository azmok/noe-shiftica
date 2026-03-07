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
import { LivePreview } from "./LivePreview";

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
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ preview?: string }>;
}) {
    const { slug } = await params;
    const { preview } = await searchParams;
    const isPreview = preview === 'true';
    const payload = await getPayload({ config: configPromise });

    // Fetch the post matching the slug
    const posts = await payload.find({
        collection: "posts",
        where: {
            slug: {
                equals: decodeURIComponent(slug),
            },
            ...(isPreview ? {} : {
                _status: {
                    equals: 'published',
                },
            }),
        },
        depth: 1,
        limit: 1,
        draft: isPreview,
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

            <LivePreview initialPost={post} isPreview={isPreview} prevPost={prevPost} nextPost={nextPost} />

            <Footer variant="blog" />
        </div>
    );
}
