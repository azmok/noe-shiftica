import { getPayload } from 'payload'
import config from '@payload-config'

// Serves a hosted single-file HTML app verbatim as a full document.
// Because we return the raw HTML with `Content-Type: text/html`, the browser
// parses it as a real page and runs all JavaScript (including <head> scripts),
// unlike the article-embed flow which strips/never-executes scripts.
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'hosted-apps',
    where: {
      and: [{ slug: { equals: slug } }, { published: { equals: true } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const doc = result.docs[0]

  if (!doc || typeof doc.html !== 'string' || doc.html.length === 0) {
    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  return new Response(doc.html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // The DB is the source of truth; always serve fresh so admin edits go live immediately.
      'Cache-Control': 'no-store',
      // Allow this page to be opened in its own tab from article links.
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
