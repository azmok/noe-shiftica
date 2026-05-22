import React from "react";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { notFound } from "next/navigation";
import { LivePreview } from "../../../blog/[slug]/LivePreview";
import { unstable_noStore as noStore } from "next/cache";

export default async function DevPostPreviewPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    noStore();

    const { slug } = await params;
    const payload = await getPayload({ config: configPromise });

    const posts = await payload.find({
        collection: "tech-posts",
        where: {
            slug: {
                equals: decodeURIComponent(slug),
            },
        },
        depth: 2,
        limit: 1,
        draft: true,
        overrideAccess: true,
    });

    if (!posts.docs || posts.docs.length === 0) {
        notFound();
    }

    const post = posts.docs[0];

    let prevPost = null;
    let nextPost = null;

    if (post.publishedAt) {
        const prevPostsRes = await payload.find({
            collection: "tech-posts",
            where: {
                publishedAt: { less_than: post.publishedAt },
                _status: { equals: 'published' },
            },
            sort: '-publishedAt',
            limit: 1,
            depth: 0,
            overrideAccess: true,
        });
        prevPost = prevPostsRes.docs[0] || null;

        const nextPostsRes = await payload.find({
            collection: "tech-posts",
            where: {
                publishedAt: { greater_than: post.publishedAt },
                _status: { equals: 'published' },
            },
            sort: 'publishedAt',
            limit: 1,
            depth: 0,
            overrideAccess: true,
        });
        nextPost = nextPostsRes.docs[0] || null;
    }

    return (
        <div className="min-h-screen flex flex-col font-sans antialiased relative overflow-x-hidden transition-colors duration-500">
            <Header />
            <LivePreview initialPost={post as any} isPreview={true} prevPost={prevPost as any} nextPost={nextPost as any} />
            <Footer variant="blog" />
        </div>
    );
}
