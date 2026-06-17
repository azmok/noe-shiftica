import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { assembleHtmlDocument } from '@/plugins/html-hosting/lib/assemble'

/**
 * 公開ホスティング配信ルート: GET /p/<slug>
 *
 * hosted-pages コレクションから slug 一致のドキュメントを取得し、
 * HTML/CSS/JS を 1枚の完全な HTML ドキュメントへ組み立てて返す。
 * Route Handler はレイアウトの影響を受けないため、サイトのヘッダー/フッターを
 * 含まないスタンドアロンな HTML として配信される。
 */

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'hosted-pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const doc = result.docs[0]
  if (!doc) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const html = assembleHtmlDocument({
    title: doc.title || slug,
    html: doc.html || '',
    css: doc.css || '',
    js: doc.js || '',
  })

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
