import { Header } from "../../components/Header"
import { Footer } from "../../components/Footer"
import Script from "next/script"
import { BlogFallbackHero } from "../../components/BlogFallbackHero";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { RichText } from '@payloadcms/richtext-lexical/react';
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostArticle } from "./PostArticle";
import { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    try {
        const payload = await getPayload({ config: configPromise });

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
            return {};
        }

        const post = posts.docs[0];
        const cmd = (post.customMetaData as Record<string, any>) || {};

        // Prioritize customMetaData for SEO fields
        const title = cmd.seo_title || cmd.title || post.title;
        const description = cmd.seo_description || cmd.description || "";

        // OpenGraph images fallback logic
        // cmd.og_image must be an absolute URL; relative paths (slugs from frontmatter) are ignored
        const cmdOgImage = cmd.og_image && (cmd.og_image.startsWith('http://') || cmd.og_image.startsWith('https://')) ? cmd.og_image : null;
        const ogImage = cmdOgImage || post.ogImage || (post.coverImage && typeof post.coverImage === 'object' ? (post.coverImage as any).url : '');

        return {
            title: title,
            description: description,
            openGraph: {
                title: cmd.og_title || title,
                description: cmd.og_description || description,
                type: 'article',
                publishedTime: post.publishedAt || undefined,
                ...(ogImage ? { images: [{ url: ogImage }] } : {}),
            },
            twitter: {
                card: 'summary_large_image',
                title: cmd.twitter_title || cmd.og_title || title,
                description: cmd.twitter_description || cmd.og_description || description,
                ...(ogImage ? { images: [ogImage] } : {}),
            },
        };
    } catch (error) {
        console.error(`Metadata generation failed for slug: ${slug}`, error);
        return {
            title: "Noe Shiftica Journal",
        };
    }
}

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
        <div className="md:bg-(--color-neu-bg-light) bg-(--mobile-bg) md:text-slate-900 text-(--mobile-text-primary) min-h-screen flex flex-col font-sans antialiased relative overflow-x-hidden transition-colors duration-500">
            <Header />
            <PostArticle post={post} prevPost={prevPost} nextPost={nextPost} />
            <Footer variant="blog" />

            {/* GLOBAL FAILSAFE: Force visibility for any images stuck at opacity: 0 */}
            <Script
                id="force-image-visibility-detail"
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
