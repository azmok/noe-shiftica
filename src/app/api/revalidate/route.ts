import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/revalidate
 *
 * On-demand ISR revalidation endpoint.
 * Requires a valid secret token to prevent unauthorized cache busting.
 *
 * Request body (JSON):
 *   { "secret": "<REVALIDATE_SECRET>", "slug": "optional-post-slug" }
 *
 * - If slug is provided: revalidates /blog and /blog/[slug]
 * - If slug is omitted: revalidates /blog only
 */
export async function POST(req: NextRequest) {
    const { secret, slug } = await req.json().catch(() => ({}));

    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    revalidatePath('/blog');

    if (slug && typeof slug === 'string') {
        revalidatePath(`/blog/${slug}`);
    }

    return NextResponse.json({
        revalidated: true,
        paths: slug ? ['/blog', `/blog/${slug}`] : ['/blog'],
    });
}
