import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/revalidate
 *
 * On-demand ISR revalidation endpoint.
 * Requires a valid secret token to prevent unauthorized cache busting.
 *
 * Request body (JSON):
 *   { "secret": "<REVALIDATE_SECRET>", "slug": "optional-post-slug", "collection": "posts" | "tech-posts" }
 *
 * - If collection is "tech-posts": revalidates /dev and /dev/[slug]
 * - Default (collection omitted or "posts"): revalidates /blog and /blog/[slug]
 */
export async function POST(req: NextRequest) {
    const { secret, slug, collection } = await req.json().catch(() => ({}));

    const trimmedSecret = secret?.trim();
    const serverSecret = process.env.REVALIDATE_SECRET?.trim();

    console.log(`[Revalidate Debug] Received secret length: ${trimmedSecret?.length || 0}, slice: ${trimmedSecret?.slice(0, 4)}...`);
    console.log(`[Revalidate Debug] Server secret length: ${serverSecret?.length || 0}, slice: ${serverSecret?.slice(0, 4)}...`);

    if (!trimmedSecret || trimmedSecret !== serverSecret) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const isTech = collection === 'tech-posts';
    const basePath = isTech ? '/dev' : '/blog';

    revalidatePath(basePath);

    if (slug && typeof slug === 'string') {
        revalidatePath(`${basePath}/${slug}`);
    }

    return NextResponse.json({
        revalidated: true,
        paths: slug ? [basePath, `${basePath}/${slug}`] : [basePath],
    });
}

