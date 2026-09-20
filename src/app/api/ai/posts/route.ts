import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { parseMarkdownToLexical } from '@/plugins/markdownImport'
import { translateToSlug } from '@/lib/translateToSlug'

/**
 * Validate incoming API key against AI_API_KEY or PAYLOAD_SECRET.
 */
function validateAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const apiKeyHeader = request.headers.get('x-api-key')

  let clientToken = ''
  if (apiKeyHeader) {
    clientToken = apiKeyHeader.trim()
  } else if (authHeader?.startsWith('Bearer ')) {
    clientToken = authHeader.substring(7).trim()
  }

  if (!clientToken) return false

  const validKey = process.env.AI_API_KEY || process.env.PAYLOAD_SECRET
  if (!validKey) {
    console.error('[AI Post API] Neither AI_API_KEY nor PAYLOAD_SECRET is configured.')
    return false
  }

  return clientToken === validKey
}

/**
 * Helper to record operation results in ApiLogs collection.
 */
async function recordApiLog(
  payload: any,
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
  }
) {
  try {
    await payload.create({
      collection: 'api-logs',
      data,
    })
  } catch (err: any) {
    console.error('[AI Post API] Failed to record API log:', err.message)
  }
}

/**
 * POST /api/ai/posts
 * Creates or updates an article via AI request.
 */
export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // 1. Auth check
  if (!validateAuth(request)) {
    await recordApiLog(payload, {
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
    await recordApiLog(payload, {
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
    await recordApiLog(payload, {
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
    await recordApiLog(payload, {
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

  const targetCollection = collection === 'tech-posts' ? 'tech-posts' : 'posts'

  try {
    // 3. Resolve slug
    let slug = rawSlug?.trim()
    if (!slug) {
      slug = await translateToSlug(title)
    }

    // 4. Parse Markdown into Lexical AST
    const { lexical, frontmatter } = await parseMarkdownToLexical(markdown, payload.config)

    // Merge frontmatter description if not explicitly provided
    const finalDescription = description || frontmatter.description || ''

    // 5. Resolve category ID if category name or slug is passed
    let categoryId: any = undefined
    if (category) {
      if (typeof category === 'number') {
        categoryId = category
      } else if (typeof category === 'string') {
        const catResult = await payload.find({
          collection: 'categories',
          where: {
            or: [
              { name: { equals: category } },
              { slug: { equals: category } },
            ],
          },
          limit: 1,
        })
        if (catResult.docs.length > 0) {
          categoryId = catResult.docs[0].id
        }
      }
    }

    // 6. Check if post with same slug or ID already exists (update vs create)
    const existing = await payload.find({
      collection: targetCollection,
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    })

    const postData: any = {
      title,
      slug,
      content: lexical,
      _status: status === 'published' ? 'published' : 'draft',
      ...(finalDescription ? { description: finalDescription } : {}),
      ...(categoryId ? { category: categoryId } : {}),
      ...(Array.isArray(tags) ? { tags } : {}),
      ...(customCss ? { customCss } : {}),
      ...(customJs ? { customJs } : {}),
    }

    let savedDoc: any
    let operation = 'create'

    if (existing.docs.length > 0) {
      // Update existing post
      operation = 'update'
      const existingId = existing.docs[0].id
      savedDoc = await payload.update({
        collection: targetCollection,
        id: existingId,
        data: postData,
      })
    } else {
      // Create new post
      savedDoc = await payload.create({
        collection: targetCollection,
        data: postData,
      })
    }

    const docId = String(savedDoc.id)
    const docSlug = savedDoc.slug || slug
    const publicUrl = targetCollection === 'tech-posts' ? `/dev/${docSlug}` : `/blog/${docSlug}`

    // 7. Log success
    await recordApiLog(payload, {
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
        status: savedDoc._status || savedDoc.status || status,
        url: publicUrl,
      },
      { status: operation === 'create' ? 201 : 200 }
    )
  } catch (error: any) {
    console.error('[AI Post API] Error saving post:', error)

    await recordApiLog(payload, {
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
      { status: 500 }
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
  if (!validateAuth(request)) {
    await recordApiLog(payload, {
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

  const targetCollection = collectionName === 'tech-posts' ? 'tech-posts' : 'posts'
  const summary = JSON.stringify({ targetId, targetSlug, targetCollection })

  if (!targetId && !targetSlug) {
    await recordApiLog(payload, {
      action: 'delete',
      status: 'error',
      responseStatus: 400,
      clientIp,
      requestSummary: summary,
      errorMessage: 'Either "id" or "slug" query parameter / body field is required.',
    })
    return NextResponse.json(
      { error: 'Either "id" or "slug" is required to delete an article.' },
      { status: 400 }
    )
  }

  try {
    let docToDelete: any = null

    if (targetId) {
      docToDelete = await payload.findByID({
        collection: targetCollection,
        id: targetId,
      })
    } else if (targetSlug) {
      const searchResult = await payload.find({
        collection: targetCollection,
        where: {
          slug: { equals: targetSlug },
        },
        limit: 1,
      })
      if (searchResult.docs.length > 0) {
        docToDelete = searchResult.docs[0]
      }
    }

    if (!docToDelete) {
      await recordApiLog(payload, {
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
    })

    await recordApiLog(payload, {
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

    await recordApiLog(payload, {
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
      { status: 500 }
    )
  }
}
