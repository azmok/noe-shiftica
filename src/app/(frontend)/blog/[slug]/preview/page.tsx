import React from "react";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { notFound } from "next/navigation";
import { LivePreview } from "../LivePreview";
import { unstable_noStore as noStore } from "next/cache";
import Script from "next/script";

// Draft preview route: never index. It renders unpublished content and must not
// appear in search results or compete with the published article's canonical.
export const metadata = {
    robots: { index: false, follow: false },
};

export default async function BlogPostPreviewPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    // Opt out of all Next.js caching so every preview request fetches the
    // latest draft data directly from the DB (bypasses Data Cache & Full Route Cache).
    noStore();

    const { slug } = await params;
    const payload = await getPayload({ config: configPromise });

    const posts = await payload.find({
        collection: "posts",
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
            collection: "posts",
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
            collection: "posts",
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
        <div className="min-h-screen bg-background-void selection:bg-neu-primary/30 selection:text-background-void flex flex-col font-sans antialiased relative overflow-hidden">
            {/* Premium Depth Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Mesh Gradient Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neu-primary/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-neu-primary/5 blur-[100px]" />
                <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] rounded-full bg-blue-500/5 blur-[80px]" />
                
                {/* SVG Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ filter: 'url(#noiseFilterDetail)' }}></div>
            </div>

            <Header />
            <LivePreview initialPost={post} isPreview={true} prevPost={prevPost} nextPost={nextPost} />
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
                id="force-image-visibility-preview"
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
