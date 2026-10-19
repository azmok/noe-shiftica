import React from "react";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { notFound } from "next/navigation";
import { LivePreview } from "../../../blog/[slug]/LivePreview";
import { unstable_noStore as noStore } from "next/cache";
import Script from "next/script";

// Draft preview route: never index. It renders unpublished content and must not
// appear in search results or compete with the published article's canonical.
export const metadata = {
    robots: { index: false, follow: false },
};

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

            <LivePreview initialPost={post as any} isPreview={true} prevPost={prevPost as any} nextPost={nextPost as any} />

            {/* GLOBAL FAILSAFE: Force visibility for any images stuck at opacity: 0 */}
            <Script
                id="force-image-visibility-preview-dev"
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
