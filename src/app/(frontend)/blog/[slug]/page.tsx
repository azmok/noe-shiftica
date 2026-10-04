import { Header } from "../../components/Header"
import { Footer } from "../../components/Footer"
import Script from "next/script"
import { BlogFallbackHero } from "../../components/BlogFallbackHero";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { RichText } from '@payloadcms/richtext-lexical/react';
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostArticle } from "./PostArticle";
import { BlogPostingJsonLd } from "../../components/BlogPostingJsonLd";
import { findAdjacentPosts, findPublishedPost } from "@/lib/postQueries";
import { Metadata } from "next";

// CDN TTL. revalidatePath() refreshes the ISR cache but does NOT purge the App Hosting
// CDN edge (verified 2026-10-04: Age kept growing after /api/revalidate). Without this the
// page is sent as `s-maxage=31536000` and the edge keeps serving the pre-edit HTML until the
// next deploy. 60s → the edge re-fetches within a minute of a CMS save.
export const revalidate = 60;


export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    // ISR: metadata is cached alongside the page; revalidated on-demand via /api/revalidate.
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    try {
        // Same cached lookup as the page below, so a render queries the post once.
        const post = await findPublishedPost("posts", decodedSlug, 1);

        // Try historical slug check for redirection
        if (!post) {
            const payload = await getPayload({ config: configPromise });
            const redirectPosts = await payload.find({
                collection: "posts",
                where: {
                    'slugHistory.slug': {
                        equals: decodedSlug,
                    },
                },
                depth: 1,
                limit: 1,
                overrideAccess: true,
            });
            if (redirectPosts.docs && redirectPosts.docs.length > 0) {
                const targetPost = redirectPosts.docs[0];
                if (targetPost.slug) {
                    redirect(`/blog/${targetPost.slug}`);
                }
            }
        }

        if (!post) {
            return {};
        }

        const cmd = (post.customMetaData as Record<string, any>) || {};

        // Prioritize customMetaData for SEO fields
        const title = cmd.seo_title || cmd.title || post.title;
        const description = cmd.seo_description || cmd.description || "";

        // Self-referencing canonical, defaulting to this post's own URL. A custom
        // override from customMetaData.canonical wins (absolute URL or path kept
        // as-is; a bare slug is resolved under /blog). Without this, the page
        // inherits the root layout's `canonical: "/"`.
        const customCanonical = typeof cmd.canonical === 'string' ? cmd.canonical.trim() : '';
        const canonical = customCanonical
            ? (/^https?:\/\//.test(customCanonical) || customCanonical.startsWith('/') ? customCanonical : `/blog/${customCanonical}`)
            : `/blog/${post.slug}`;

        // OpenGraph images fallback logic
        // cmd.og_image must be an absolute URL; relative paths (slugs from frontmatter) are ignored
        const cmdOgImage = cmd.og_image && (cmd.og_image.startsWith('http://') || cmd.og_image.startsWith('https://')) ? cmd.og_image : null;
        const ogImage = cmdOgImage || post.ogImage || (post.coverImage && typeof post.coverImage === 'object' ? (post.coverImage as any).url : '');

        return {
            title: title,
            description: description,
            alternates: {
                canonical: canonical,
            },
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
            alternates: {
                // Even on the error fallback, self-reference this post's own URL
                // so the page never inherits the root layout's `canonical: "/"`.
                canonical: `/blog/${decodedSlug}`,
            },
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
            overrideAccess: true,
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
    // ISR: page is cached; revalidated on-demand via revalidatePath() in Posts.ts hooks,
    // which (with no manual Cache-Control header — see next.config.ts) invalidates the
    // Firebase App Hosting CDN edge in tandem with the Next.js Full Route Cache.
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const payload = await getPayload({ config: configPromise });

    // Fetch the post matching the slug.
    // overrideAccess: true — ISR background workers have no auth context; without this,
    // Payload v3 applies access control and may return 0 results, causing false 404s.
    // draft: false — explicit to prevent any draft version interference.
    // IIFE + try/catch — DB errors throw (preserving stale cached page) instead of calling
    // notFound(), so the 404 is only served when the query succeeds but returns 0 docs.
    let post = await (async () => {
        try {
            return await findPublishedPost("posts", decodedSlug, 1);
        } catch (error) {
            console.error(`[ISR][blog/${slug}] payload.find threw an error — preserving stale cache:`, error);
            throw error;
        }
    })();

    // Try historical slug check for redirection
    if (!post) {
        try {
            const redirectPosts = await payload.find({
                collection: "posts",
                where: {
                    'slugHistory.slug': {
                        equals: decodedSlug,
                    },
                    _status: {
                        equals: 'published',
                    },
                },
                depth: 1,
                limit: 1,
                overrideAccess: true,
                draft: false,
            });
            if (redirectPosts.docs && redirectPosts.docs.length > 0) {
                const targetPost = redirectPosts.docs[0];
                if (targetPost.slug) {
                    console.log(`[ISR][blog/${slug}] Redirecting to new slug: ${targetPost.slug}`);
                    redirect(`/blog/${targetPost.slug}`);
                }
            }
        } catch (error) {
            console.error(`[ISR][blog/${slug}] Error checking redirect history:`, error);
        }
    }

    if (!post) {
        console.warn(`[ISR][blog/${slug}] payload.find succeeded but returned 0 docs. _status may not be 'published', or the post was deleted.`);
        notFound();
    }

    const { prevPost, nextPost } = post.publishedAt
        ? await findAdjacentPosts("posts", post.publishedAt)
        : { prevPost: null, nextPost: null };

    return (
        <div className="min-h-screen bg-background-void selection:bg-neu-primary/30 selection:text-background-void flex flex-col font-sans antialiased relative overflow-clip">
            {/* Premium Depth Background: static radial gradients. The previous blurred,
                pulsing blobs + full-screen SVG noise (mix-blend-overlay) left iPhone Safari
                on a black screen while loading and while scrolling to in-page links. */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: [
                        "radial-gradient(circle at 10% 10%, rgb(204 221 0 / 0.07), transparent 35%)",
                        "radial-gradient(circle at 90% 75%, rgb(204 221 0 / 0.035), transparent 30%)",
                        "radial-gradient(circle at 80% 50%, rgb(59 130 246 / 0.035), transparent 25%)",
                    ].join(", "),
                }}
            />

            <BlogPostingJsonLd post={post} basePath="/blog" />
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
