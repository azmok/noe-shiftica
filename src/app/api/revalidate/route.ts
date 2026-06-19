import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/revalidate
 *
 * On-demand ISR revalidation endpoint.
 * Requires a valid secret token to prevent unauthorized cache busting.
 *
 * Request body (JSON):
 *   { "secret": "<REVALIDATE_SECRET>", "slug": "optional-post-slug", "collection": "posts" | "tech-posts" | "whats-new" | "changelog" }
 *
 * - If collection is "tech-posts": revalidates /dev and /dev/[slug]
 * - If collection is "whats-new": revalidates /whats-new and /whats-new/[slug]
 * - If collection is "changelog": revalidates /changelog (single-page, no slug)
 * - Default (collection omitted or "posts"): revalidates /blog and /blog/[slug]
 *
 * After purging Next.js Full Route Cache, this handler pre-warms the CDN cache
 * by issuing a HEAD request to each invalidated path. Firebase App Hosting honors
 * Next.js revalidatePath() and purges its CDN edge cache in tandem.
 */
export async function POST(req: NextRequest) {
    const { secret, slug, collection } = await req.json().catch(() => ({}));

    const trimmedSecret = secret?.trim();
    const serverSecret = process.env.REVALIDATE_SECRET?.trim();

    if (!trimmedSecret || trimmedSecret !== serverSecret) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const basePathByCollection: Record<string, string> = {
        'tech-posts': '/dev',
        'whats-new': '/whats-new',
        'changelog': '/changelog',
        'hosted-pages': '/p',
    };
    const basePath = basePathByCollection[collection as string] || '/blog';
    // Changelog is a single timeline page with no per-entry routes.
    const hasSlugRoute = collection !== 'changelog';
    // hosted-pages (/p) has no index page — only the per-slug route /p/<slug> exists.
    const hasBasePage = collection !== 'hosted-pages';

    const revalidatedPaths: string[] = [];

    // 1. Purge Next.js Full Route Cache (also signals Firebase App Hosting CDN to purge)
    if (hasBasePage) {
        revalidatePath(basePath);
        revalidatedPaths.push(basePath);
    }

    if (hasSlugRoute && slug && typeof slug === 'string') {
        revalidatePath(`${basePath}/${slug}`);
        revalidatedPaths.push(`${basePath}/${slug}`);
    }

    // 2. Pre-warm: issue HEAD requests to trigger Next.js to rebuild and cache the pages
    //    so the next real visitor gets an instantly cached response (not a cache miss).
    const origin = process.env.NEXT_PUBLIC_SERVER_URL || 'https://noe-shiftica.com';
    const prewarmResults: Record<string, number | string> = {};

    await Promise.allSettled(
        revalidatedPaths.map(async (path) => {
            const url = `${origin}${path}`;
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    // No-cache header ensures this request bypasses any existing cache
                    // and forces Next.js to render a fresh page into the cache.
                    headers: { 'Cache-Control': 'no-cache' },
                    // Short timeout — pre-warming is best-effort; don't block the response
                    signal: AbortSignal.timeout(10000),
                });
                prewarmResults[path] = res.status;
            } catch (e) {
                prewarmResults[path] = `error: ${e instanceof Error ? e.message : String(e)}`;
            }
        })
    );

    console.log(`[Revalidate] Purged and pre-warmed paths:`, revalidatedPaths, 'results:', prewarmResults);

    return NextResponse.json({
        revalidated: true,
        paths: revalidatedPaths,
        prewarmed: prewarmResults,
    });
}
