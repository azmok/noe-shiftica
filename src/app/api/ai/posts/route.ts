import { NextResponse, type NextRequest } from 'next/server'
import { getPayload, type Payload, type TypedUser } from 'payload'
import config from '@payload-config'
import { parseMarkdownToLexical } from '@/plugins/markdownImport'
import { translateToSlug } from '@/lib/translateToSlug'
import {
  type Operation,
  canAccess,
  isActiveUser,
  isApiClient,
} from '@/plugins/api-clients/permissions'

/**
 * AI 用の記事 API。
 *
 * 認証は /admin → 設定 → 外部AI連携 で発行した API キー。次のどれかのヘッダーで渡す:
 *   - `x-api-key: <キー>`
 *   - `Authorization: Bearer <キー>`
 *   - `Authorization: api-clients API-Key <キー>`（Payload 標準形式）
 * 実行できる操作は、そのAIに付けた権限（作成 / 編集 / 削除 / 公開）に従う。
 */

type PostCollection = 'posts' | 'tech-posts'

/** API キー（またはログイン中の管理者セッション）を検証して、有効な利用者を返す */
async function authenticate(payload: Payload, request: NextRequest): Promise<TypedUser | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const apiKey =
    request.headers.get('x-api-key')?.trim() ||
    (authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '')

  const headers = new Headers(request.headers)
  if (apiKey) headers.set('authorization', `api-clients API-Key ${apiKey}`)

  try {
    const { user } = await payload.auth({ headers })
    return isActiveUser(user) ? user : null
  } catch {
    return null
  }
}

function clientIdOf(user: unknown): number | undefined {
  if (!isApiClient(user) || user.id === undefined) return undefined
  const id = Number(user.id)
  return Number.isFinite(id) ? id : undefined
}

function clientLabelOf(user: unknown): string {
  if (isApiClient(user)) return user.name || `api-client #${user.id}`
  const email = (user as { email?: string } | null)?.email
  return email ? `admin: ${email}` : 'unknown'
}

/**
 * Helper to record operation results in ApiLogs collection.
 */
async function recordApiLog(
  payload: Payload,
  user: unknown,
  data: {
    action: 'post' | 'delete'
    status: 'success' | 'error'
    responseStatus: number
    postTitle?: string
    postSlug?: string
    postId?: string
    clientIp?: string
    requestSummary?: string
    errorMessage?: string
  },
) {
  try {
    await payload.create({
      collection: 'api-logs',
      data: {
        ...data,
        client: clientIdOf(user),
        clientName: user ? clientLabelOf(user) : '（認証失敗）',
      },
    })
  } catch (err: any) {
    console.error('[AI Post API] Failed to record API log:', err.message)
  }
}

function forbidden(operation: Operation, collection: PostCollection) {
  return `Forbidden: this API key is not allowed to "${operation}" in "${collection}". Ask the site admin to enable it in 外部AI連携.`
}

/**
 * POST /api/ai/posts
 * Creates or updates an article via AI request.
 */
export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // 1. Auth check
  const user = await authenticate(payload, request)
  if (!user) {
    await recordApiLog(payload, null, {
      action: 'post',
      status: 'error',
      responseStatus: 401,
      clientIp,
      errorMessage: 'Unauthorized: Invalid or missing API key',
    })
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing API key' }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 400,
      clientIp,
      errorMessage: 'Invalid JSON request body',
    })
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    title,
    markdown,
    slug: rawSlug,
    status = 'draft',
    collection = 'posts',
    description,
    category,
    tags,
    customCss,
    customJs,
  } = body

  const summary = JSON.stringify({
    title,
    slug: rawSlug,
    status,
    collection,
    hasMarkdown: Boolean(markdown),
    markdownLength: markdown?.length ?? 0,
  })

  // 2. Validate input
  if (!title || typeof title !== 'string' || !title.trim()) {
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 400,
      clientIp,
      requestSummary: summary,
      errorMessage: 'Field "title" is required and cannot be empty.',
    })
    return NextResponse.json({ error: 'Field "title" is required' }, { status: 400 })
  }

  if (markdown === undefined || typeof markdown !== 'string') {
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 400,
      postTitle: title,
      clientIp,
      requestSummary: summary,
      errorMessage: 'Field "markdown" is required.',
    })
    return NextResponse.json({ error: 'Field "markdown" is required' }, { status: 400 })
  }

  const targetCollection: PostCollection = collection === 'tech-posts' ? 'tech-posts' : 'posts'
  const wantsPublish = status === 'published'

  try {
    // 3. Resolve slug
    let slug = rawSlug?.trim()
    if (!slug) {
      slug = await translateToSlug(title)
    }

    // 4. Check if post with same slug already exists (update vs create).
    //    Internal lookup — the permission check below decides what the caller may do.
    const existing = await payload.find({
      collection: targetCollection,
      where: {
        slug: { equals: slug },
      },
      limit: 1,
      depth: 0,
    })
    const existingDoc: any = existing.docs[0]
    const operation: 'create' | 'update' = existingDoc ? 'update' : 'create'

    // 5. Permission check (create / update, plus publish when saving as published)
    const missing: Operation | null = !canAccess(user, targetCollection, operation)
      ? operation
      : wantsPublish && !canAccess(user, targetCollection, 'publish')
        ? 'publish'
        : null
    if (missing) {
      const message = forbidden(missing, targetCollection)
      await recordApiLog(payload, user, {
        action: 'post',
        status: 'error',
        responseStatus: 403,
        postTitle: title,
        postSlug: slug,
        postId: existingDoc ? String(existingDoc.id) : undefined,
        clientIp,
        requestSummary: summary,
        errorMessage: message,
      })
      return NextResponse.json({ error: message }, { status: 403 })
    }

    // 6. Parse Markdown into Lexical AST
    const { lexical, frontmatter } = await parseMarkdownToLexical(markdown, payload.config)

    // Merge frontmatter description if not explicitly provided
    const finalDescription = description || frontmatter.description || ''

    // 7. Resolve category ID if category name or ID is passed
    let categoryId: number | undefined
    if (category) {
      if (typeof category === 'number') {
        categoryId = category
      } else if (typeof category === 'string') {
        const catResult = await payload.find({
          collection: 'categories',
          where: { name: { equals: category } },
          limit: 1,
          depth: 0,
        })
        if (catResult.docs.length > 0) {
          categoryId = Number(catResult.docs[0].id)
        }
      }
    }

    // Tags live in customMetaData.tags (TagsField). Keep any other existing metadata.
    const customMetaData = Array.isArray(tags)
      ? { ...(existingDoc?.customMetaData ?? {}), tags }
      : undefined

    const postData: any = {
      title,
      slug,
      content: lexical,
      _status: wantsPublish ? 'published' : 'draft',
      ...(finalDescription ? { description: finalDescription } : {}),
      ...(categoryId ? { categories: [categoryId] } : {}),
      ...(customMetaData ? { customMetaData } : {}),
      ...(customCss ? { customCss } : {}),
      ...(customJs ? { customJs } : {}),
    }

    // Write as the caller so collection access (the 外部AI連携 matrix) is enforced again.
    const savedDoc: any =
      operation === 'update'
        ? await payload.update({
            collection: targetCollection,
            id: existingDoc.id,
            data: postData,
            user,
            overrideAccess: false,
          })
        : await payload.create({
            collection: targetCollection,
            data: postData,
            user,
            overrideAccess: false,
          })

    const docId = String(savedDoc.id)
    const docSlug = savedDoc.slug || slug
    const publicUrl = targetCollection === 'tech-posts' ? `/dev/${docSlug}` : `/blog/${docSlug}`

    // 8. Log success
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'success',
      responseStatus: operation === 'create' ? 201 : 200,
      postTitle: title,
      postSlug: docSlug,
      postId: docId,
      clientIp,
      requestSummary: summary,
    })

    return NextResponse.json(
      {
        success: true,
        operation,
        id: docId,
        slug: docSlug,
        status: savedDoc._status || status,
        url: publicUrl,
      },
      { status: operation === 'create' ? 201 : 200 },
    )
  } catch (error: any) {
    console.error('[AI Post API] Error saving post:', error)

    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 500,
      postTitle: title,
      postSlug: rawSlug,
      clientIp,
      requestSummary: summary,
      errorMessage: error.message || 'Internal Server Error',
    })

    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/ai/posts?id=xxx OR ?slug=xxx
 * Deletes a post via AI request.
 */
export async function DELETE(request: NextRequest) {
  const payload = await getPayload({ config })
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // 1. Auth check
  const user = await authenticate(payload, request)
  if (!user) {
    await recordApiLog(payload, null, {
      action: 'delete',
      status: 'error',
      responseStatus: 401,
      clientIp,
      errorMessage: 'Unauthorized: Invalid or missing API key',
    })
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing API key' }, { status: 401 })
  }

  // Parse target from query params or body
  const { searchParams } = new URL(request.url)
  let targetId = searchParams.get('id')
  let targetSlug = searchParams.get('slug')
  let collectionName = searchParams.get('collection') || 'posts'

  // Also accept JSON body if params are absent
  if (!targetId && !targetSlug) {
    try {
      const body = await request.json()
      targetId = body.id
      targetSlug = body.slug
      if (body.collection) collectionName = body.collection
    } catch {
      // Body is optional if searchParams provided
    }
  }

  const targetCollection: PostCollection = collectionName === 'tech-posts' ? 'tech-posts' : 'posts'
  const summary = JSON.stringify({ targetId, targetSlug, targetCollection })

  // 2. Permission check — before touching anything
  if (!canAccess(user, targetCollection, 'delete')) {
    const message = forbidden('delete', targetCollection)
    await recordApiLog(payload, user, {
      action: 'delete',
      status: 'error',
      responseStatus: 403,
      postId: targetId || undefined,
      postSlug: targetSlug || undefined,
      clientIp,
      requestSummary: summary,
      errorMessage: message,
    })
    return NextResponse.json({ error: message }, { status: 403 })
  }

  if (!targetId && !targetSlug) {
    await recordApiLog(payload, user, {
      action: 'delete',
      status: 'error',
      responseStatus: 400,
      clientIp,
      requestSummary: summary,
      errorMessage: 'Either "id" or "slug" query parameter / body field is required.',
    })
    return NextResponse.json(
      { error: 'Either "id" or "slug" is required to delete an article.' },
      { status: 400 },
    )
  }

  try {
    let docToDelete: any = null

    if (targetId) {
      docToDelete = await payload
        .findByID({ collection: targetCollection, id: targetId, depth: 0 })
        .catch(() => null)
    } else if (targetSlug) {
      const searchResult = await payload.find({
        collection: targetCollection,
        where: {
          slug: { equals: targetSlug },
        },
        limit: 1,
        depth: 0,
      })
      docToDelete = searchResult.docs[0] ?? null
    }

    if (!docToDelete) {
      await recordApiLog(payload, user, {
        action: 'delete',
        status: 'error',
        responseStatus: 404,
        postId: targetId || undefined,
        postSlug: targetSlug || undefined,
        clientIp,
        requestSummary: summary,
        errorMessage: 'Article not found.',
      })
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 })
    }

    const deleteId = docToDelete.id
    const deleteTitle = docToDelete.title
    const deleteSlug = docToDelete.slug

    await payload.delete({
      collection: targetCollection,
      id: deleteId,
      user,
      overrideAccess: false,
    })

    await recordApiLog(payload, user, {
      action: 'delete',
      status: 'success',
      responseStatus: 200,
      postTitle: deleteTitle,
      postSlug: deleteSlug,
      postId: String(deleteId),
      clientIp,
      requestSummary: summary,
    })

    return NextResponse.json({
      success: true,
      message: `Article "${deleteTitle}" (${deleteSlug}) was successfully deleted.`,
      id: deleteId,
      slug: deleteSlug,
    })
  } catch (error: any) {
    console.error('[AI Post API] Error deleting post:', error)

    await recordApiLog(payload, user, {
      action: 'delete',
      status: 'error',
      responseStatus: 500,
      postId: targetId || undefined,
      postSlug: targetSlug || undefined,
      clientIp,
      requestSummary: summary,
      errorMessage: error.message || 'Internal Server Error',
    })

    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 },
    )
  }
}
