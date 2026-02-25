import React from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { RichText } from '@payloadcms/richtext-lexical/react';
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

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
        },
        depth: 1,
        limit: 1,
    });

    if (!posts.docs || posts.docs.length === 0) {
        notFound();
    }

    const post = posts.docs[0];

    return (
        <div className="min-h-screen text-white relative selection:bg-[#FFFFFF] selection:text-[#050505] bg-[#050505]">
            <Header />

            <main className="pt-48 pb-20 px-6 max-w-4xl mx-auto relative z-10">
                <Link
                    href="/blog"
                    className="inline-flex items-center text-white/60 hover:text-white mb-12 transition-colors font-sans"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Journal
                </Link>

                <article>
                    <header className="mb-16">
                        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-6">
                            {post.title}
                        </h1>
                        {post.publishedAt && (
                            <time className="text-white/60 font-mono text-sm">
                                {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                            </time>
                        )}
                    </header>

                    <div className="prose prose-invert prose-lg max-w-none font-sans leading-relaxed text-white/90">
                        {post.content && typeof post.content === 'object' && 'root' in post.content ? (
                            <RichText data={post.content} />
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: post.content as any }} />
                        )}
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
