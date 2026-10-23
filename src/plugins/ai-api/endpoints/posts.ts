import type { Payload, PayloadHandler, PayloadRequest, TypedUser } from 'payload'
import matter from 'gray-matter'
import { translateToSlug } from '../../../lib/translateToSlug'
import { parseMarkdownToLexical } from '../../markdownImport'
import { type Operation, canAccess, isActiveUser, isApiClient } from '../../api-clients/permissions'
import { openLinksInNewTab, prepareArticleMarkdown, replaceImagePlaceholders } from '../markdown'

/**
 * AI 用の記事 API（Payload のルートエンドポイント。URL は /api/ai/posts）。
 *
 * 認証は /admin → 設定 → 外部AI連携 で発行した API キー。次のどれかのヘッダーで渡す:
 *   - `x-api-key: <キー>`
 *   - `Authorization: Bearer <キー>`
 *   - `Authorization: api-clients API-Key <キー>`（Payload 標準形式）
 * 実行できる操作は、そのAIに付けた権限（作成 / 編集 / 削除 / 公開）に従う。
 *
 * POST の本文（JSON）:
 *   - markdown            記事フォルダの .md そのまま。冒頭の <link>/<h1>・HTML コメント・
 *                         X の widgets.js <script> は自動で除去する
 *   - title / slug / description   省略時は markdown の frontmatter から補う
 *   - images              [{ filename, data(base64), alt? }]。本文の `![alt](./filename)` を
 *                         media にアップロードして画像ブロックとして埋め込む。同名の media が
 *                         既にあれば再利用するので、更新時に送り直しても重複しない
 *   - heroImage           Hero 画像。`images` で送ったファイル名、既存 media の
 *                         ファイル名、または media ID。本文に無い画像でもよい
 *   - categories          [ID or カテゴリ名, ...]（旧 `category` 単数も可）
 *   - 本文のリンクはすべて「新しいタブで開く」（target="_blank"）で保存する
 *   - status              "draft"（既定）/ "published"
 *   - markdown を省略して { slug, collection, status: "published" } だけ送ると、
 *     既存の最新下書きをそのまま公開する（下書き確認 → 公開の2段階運用向け）
 */

const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
}

/** 1リクエストで受け付ける画像の合計サイズ（デコード後）。base64 で約1.33倍になり、App Hosting（Cloud Run）のリクエスト上限 32MB に収まるように */
const MAX_IMAGE_BYTES = 20 * 1024 * 1024

interface ImageInput {
  filename?: unknown
  data?: unknown
  alt?: unknown
}

type PostCollection = 'posts' | 'tech-posts'

/** x-api-key / Bearer を Payload 標準の `api-clients API-Key` 形式に揃えたヘッダーを返す */
function normalizeAuthHeaders(request: { headers: Headers }): Headers {
  const authHeader = request.headers.get('authorization') ?? ''
  const apiKey =
    request.headers.get('x-api-key')?.trim() ||
    (authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '')

  const headers = new Headers(request.headers)
  if (apiKey) headers.set('authorization', `api-clients API-Key ${apiKey}`)
  return headers
}

/**
 * API キー（またはログイン中の管理者セッション）を検証して、有効な利用者を返す。
 * Payload が認証済みの req.user（`api-clients API-Key` 形式・セッション）をまず使い、
 * x-api-key / Bearer で来た場合だけ標準形式に直して認証し直す。
 */
async function authenticate(req: PayloadRequest): Promise<TypedUser | null> {
  if (isActiveUser(req.user)) return req.user
  const headers = normalizeAuthHeaders(req)
  try {
    const { user } = await req.payload.auth({ headers })
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

function forbidden(operation: Operation, collection: string) {
  return `Forbidden: this API key is not allowed to "${operation}" in "${collection}". Ask the site admin to enable it in 外部AI連携.`
}

const baseName = (p: string) => p.split('/').pop() ?? p

/**
 * 本文で参照している画像を media の ID に解決する。
 * 同名ファイルが media にあり、送られたデータとサイズが同じ（またはデータが送られていない）なら
 * 再利用する。別記事の同名・別画像を取り違えないよう、サイズが違えば新規にアップロードする
 * （Payload が名前の重複を -1 などで回避する）。アップロードは呼び出し元として実行するので、
 * Media の「作成」権限が必要。
 */
async function resolveImages(
  payload: Payload,
  user: TypedUser,
  refs: { src: string; alt: string }[],
  inputs: ImageInput[],
): Promise<{ mediaIds: Array<number | string> } | { error: string; status: number }> {
  if (refs.length === 0) return { mediaIds: [] }

  const provided = new Map<string, { buffer: Buffer; mimetype: string; alt?: string }>()
  let totalBytes = 0
  for (const img of inputs) {
    if (typeof img?.filename !== 'string' || typeof img?.data !== 'string') {
      return { error: 'Each item in "images" needs "filename" and base64 "data"', status: 400 }
    }
    const name = baseName(img.filename)
    const mimetype = IMAGE_MIME[name.split('.').pop()?.toLowerCase() ?? '']
    if (!mimetype) {
      return { error: `Unsupported image type: ${name} (png / jpg / gif / webp only)`, status: 400 }
    }
    const buffer = Buffer.from(img.data.replace(/^data:[^;,]+;base64,/, ''), 'base64')
    totalBytes += buffer.length
    if (totalBytes > MAX_IMAGE_BYTES) {
      return { error: `Images exceed ${MAX_IMAGE_BYTES / 1024 / 1024}MB in total`, status: 413 }
    }
    provided.set(name, { buffer, mimetype, alt: typeof img.alt === 'string' ? img.alt : undefined })
  }

  const mediaIds: Array<number | string> = []
  for (const ref of refs) {
    const name = baseName(ref.src)
    // Internal lookup by filename so re-sending the same article does not duplicate media.
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: name } },
      limit: 1,
      depth: 0,
    })
    const file = provided.get(name)
    const found = existing.docs[0] as { id: number | string; filesize?: number | null } | undefined
    if (found && (!file || found.filesize === file.buffer.length)) {
      mediaIds.push(found.id)
      continue
    }

    if (!file) {
      return {
        error: `Image "${ref.src}" is referenced in the markdown but was not sent in "images"`,
        status: 400,
      }
    }
    if (!canAccess(user, 'media', 'create')) {
      return { error: forbidden('create', 'media'), status: 403 }
    }
    const created = await payload.create({
      collection: 'media',
      data: { alt: file.alt || ref.alt },
      file: { data: file.buffer, mimetype: file.mimetype, name, size: file.buffer.length },
      user,
      overrideAccess: false,
    })
    mediaIds.push(created.id)
  }
  return { mediaIds }
}

/**
 * Hero 画像の指定（media ID、またはファイル名）を media ID にする。ファイル名は本文の画像と同じ
 * 規則で、送られた `images` のアップロード／同名 media の再利用を行う
 */
async function resolveHeroImage(
  payload: Payload,
  user: TypedUser,
  input: unknown,
  inputs: ImageInput[],
  alt: string,
): Promise<{ id: number | string } | { error: string; status: number }> {
  if (typeof input === 'number' || (typeof input === 'string' && /^\d+$/.test(input.trim()))) {
    return { id: Number(input) }
  }
  if (typeof input !== 'string' || !input.trim()) {
    return { error: '"heroImage" must be a media ID or an image filename', status: 400 }
  }
  const result = await resolveImages(payload, user, [{ src: input.trim(), alt }], inputs)
  return 'error' in result ? result : { id: result.mediaIds[0] }
}

/** カテゴリ指定（ID または名前）を ID の配列にする。見つからない名前はエラー */
async function resolveCategories(
  payload: Payload,
  inputs: unknown[],
): Promise<{ ids: number[] } | { error: string }> {
  const ids: number[] = []
  for (const input of inputs) {
    if (typeof input === 'number' || (typeof input === 'string' && /^\d+$/.test(input.trim()))) {
      ids.push(Number(input))
      continue
    }
    if (typeof input !== 'string' || !input.trim()) {
      return { error: 'Each category must be an ID or a category name' }
    }
    const found = await payload.find({
      collection: 'categories',
      where: { name: { equals: input.trim() } },
      limit: 1,
      depth: 0,
    })
    if (!found.docs[0]) return { error: `Category not found: ${input}` }
    ids.push(Number(found.docs[0].id))
  }
  return { ids: [...new Set(ids)] }
}

/** 既存記事の最新下書きを、内容そのままで公開する */
async function publishExistingDraft(
  payload: Payload,
  user: TypedUser,
  collection: PostCollection,
  slug: string,
  clientIp: string,
) {
  const summary = JSON.stringify({ slug, collection, status: 'published', publishOnly: true })
  const found = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    draft: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latest: any = found.docs[0]
  if (!latest) {
    const message = `Not found: no "${collection}" post with slug "${slug}"`
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 404,
      postSlug: slug,
      clientIp,
      requestSummary: summary,
      errorMessage: message,
    })
    return Response.json({ error: message }, { status: 404 })
  }

  const missing: Operation | null = !canAccess(user, collection, 'update')
    ? 'update'
    : !canAccess(user, collection, 'publish')
      ? 'publish'
      : null
  if (missing) {
    const message = forbidden(missing, collection)
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 403,
      postTitle: latest.title,
      postSlug: slug,
      postId: String(latest.id),
      clientIp,
      requestSummary: summary,
      errorMessage: message,
    })
    return Response.json({ error: message }, { status: 403 })
  }

  try {
    // Send the whole latest draft: a partial update could publish an older body.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, _status, ...data } = latest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saved: any = await payload.update({
      collection,
      id,
      data: { ...data, _status: 'published' },
      user,
      overrideAccess: false,
    })
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'success',
      responseStatus: 200,
      postTitle: saved.title,
      postSlug: saved.slug,
      postId: String(saved.id),
      clientIp,
      requestSummary: summary,
    })
    return Response.json({
      success: true,
      operation: 'publish',
      id: String(saved.id),
      slug: saved.slug,
      status: saved._status,
      url: collection === 'tech-posts' ? `/dev/${saved.slug}` : `/blog/${saved.slug}`,
      adminUrl: `/admin/collections/${collection}/${saved.id}`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('[AI Post API] Error publishing post:', error)
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 500,
      postTitle: latest.title,
      postSlug: slug,
      postId: String(latest.id),
      clientIp,
      requestSummary: summary,
      errorMessage: message,
    })
    return Response.json({ error: 'Internal Server Error', details: message }, { status: 500 })
  }
}

/**
 * POST /api/ai/posts
 * Creates or updates an article via AI request.
 */
export const aiPostsCreateHandler: PayloadHandler = async (req) => {
  const { payload } = req
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  // 1. Auth check
  const user = await authenticate(req)
  if (!user) {
    await recordApiLog(payload, null, {
      action: 'post',
      status: 'error',
      responseStatus: 401,
      clientIp,
      errorMessage: 'Unauthorized: Invalid or missing API key',
    })
    return Response.json({ error: 'Unauthorized: Invalid or missing API key' }, { status: 401 })
  }

  let body: any = {}
  try {
    body = (await req.json?.()) ?? {}
  } catch {
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 400,
      clientIp,
      errorMessage: 'Invalid JSON request body',
    })
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    markdown,
    status = 'draft',
    collection = 'posts',
    category,
    categories,
    tags,
    heroImage,
    customCss,
    customJs,
  } = body
  const images: ImageInput[] = Array.isArray(body.images) ? body.images : []

  const targetCollection: PostCollection = collection === 'tech-posts' ? 'tech-posts' : 'posts'
  const wantsPublish = status === 'published'

  // markdown 無しの publish は「既存の下書きをそのまま公開」
  if (markdown === undefined && wantsPublish && typeof body.slug === 'string' && body.slug.trim()) {
    return publishExistingDraft(payload, user, targetCollection, body.slug.trim(), clientIp)
  }

  // title / slug / description は frontmatter で補う（記事フォルダの .md をそのまま送れるように）
  let frontmatterData: Record<string, unknown> = {}
  if (typeof markdown === 'string') {
    try {
      frontmatterData = matter(markdown.trimStart()).data ?? {}
    } catch {
      frontmatterData = {}
    }
  }
  const pickString = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
  const title = pickString(body.title) ?? pickString(frontmatterData.title)
  const rawSlug = pickString(body.slug) ?? pickString(frontmatterData.slug)
  const description = pickString(body.description) ?? pickString(frontmatterData.description)

  const summary = JSON.stringify({
    title,
    slug: rawSlug,
    status,
    collection,
    hasMarkdown: Boolean(markdown),
    markdownLength: markdown?.length ?? 0,
    images: images.map((img) => (typeof img?.filename === 'string' ? img.filename : '?')),
    ...(heroImage !== undefined ? { heroImage } : {}),
  })

  // 2. Validate input
  if (!title) {
    await recordApiLog(payload, user, {
      action: 'post',
      status: 'error',
      responseStatus: 400,
      clientIp,
      requestSummary: summary,
      errorMessage: 'Field "title" is required and cannot be empty.',
    })
    return Response.json({ error: 'Field "title" is required' }, { status: 400 })
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
    return Response.json({ error: 'Field "markdown" is required' }, { status: 400 })
  }

  try {
    // 3. Resolve slug
    let slug = rawSlug
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
      return Response.json({ error: message }, { status: 403 })
    }

    // 6. Strip preview-only markup and swap image lines for placeholders, then
    //    upload / reuse the referenced images before converting.
    const prepared = prepareArticleMarkdown(markdown)
    const imageResult = await resolveImages(payload, user, prepared.images, images)
    if ('error' in imageResult) {
      await recordApiLog(payload, user, {
        action: 'post',
        status: 'error',
        responseStatus: imageResult.status,
        postTitle: title,
        postSlug: slug,
        clientIp,
        requestSummary: summary,
        errorMessage: imageResult.error,
      })
      return Response.json({ error: imageResult.error }, { status: imageResult.status })
    }

    // 6b. Hero image (posts and tech-posts both have it via the shared blog fields)
    let heroImageId: number | string | undefined
    if (heroImage !== undefined && heroImage !== null && heroImage !== '') {
      const heroResult = await resolveHeroImage(payload, user, heroImage, images, title)
      if ('error' in heroResult) {
        await recordApiLog(payload, user, {
          action: 'post',
          status: 'error',
          responseStatus: heroResult.status,
          postTitle: title,
          postSlug: slug,
          clientIp,
          requestSummary: summary,
          errorMessage: heroResult.error,
        })
        return Response.json({ error: heroResult.error }, { status: heroResult.status })
      }
      heroImageId = heroResult.id
    }

    // 7. Parse Markdown into Lexical AST and embed the uploaded images
    // Payload のルートエンドポイントは管理画面と同じ lexical を使うので、変換を直接呼べる
    // （旧 Next.js ルートでは lexical が二重に読み込まれ、Lexical error #290 で落ちていた）
    const { lexical, frontmatter } = await parseMarkdownToLexical(prepared.markdown, payload.config)
    replaceImagePlaceholders(lexical as Parameters<typeof replaceImagePlaceholders>[0], imageResult.mediaIds)
    // Same as posts written in the admin editor: links open in a new tab
    openLinksInNewTab(lexical as Parameters<typeof openLinksInNewTab>[0])

    // Merge frontmatter description if not explicitly provided
    const finalDescription = description || (frontmatter.description as string | undefined) || ''

    // 8. Resolve categories (IDs or names). The legacy single `category` is still accepted.
    const categoryInputs: unknown[] = [
      ...(Array.isArray(categories) ? categories : []),
      ...(category !== undefined && category !== null && category !== '' ? [category] : []),
    ]
    const categoryResult = await resolveCategories(payload, categoryInputs)
    if ('error' in categoryResult) {
      await recordApiLog(payload, user, {
        action: 'post',
        status: 'error',
        responseStatus: 400,
        postTitle: title,
        postSlug: slug,
        clientIp,
        requestSummary: summary,
        errorMessage: categoryResult.error,
      })
      return Response.json({ error: categoryResult.error }, { status: 400 })
    }
    const categoryIds = categoryResult.ids

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
      ...(categoryIds.length ? { categories: categoryIds } : {}),
      ...(customMetaData ? { customMetaData } : {}),
      ...(heroImageId !== undefined ? { heroImage: heroImageId } : {}),
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

    // 9. Log success
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

    return Response.json(
      {
        success: true,
        operation,
        id: docId,
        slug: docSlug,
        status: savedDoc._status || status,
        url: publicUrl,
        adminUrl: `/admin/collections/${targetCollection}/${docId}`,
        mediaIds: imageResult.mediaIds,
        ...(heroImageId !== undefined ? { heroImageId } : {}),
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

    return Response.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/ai/posts?id=xxx OR ?slug=xxx
 * Deletes a post via AI request.
 */
export const aiPostsDeleteHandler: PayloadHandler = async (req) => {
  const { payload } = req
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  // 1. Auth check
  const user = await authenticate(req)
  if (!user) {
    await recordApiLog(payload, null, {
      action: 'delete',
      status: 'error',
      responseStatus: 401,
      clientIp,
      errorMessage: 'Unauthorized: Invalid or missing API key',
    })
    return Response.json({ error: 'Unauthorized: Invalid or missing API key' }, { status: 401 })
  }

  // Parse target from query params or body
  const { searchParams } = req
  let targetId = searchParams.get('id')
  let targetSlug = searchParams.get('slug')
  let collectionName = searchParams.get('collection') || 'posts'

  // Also accept JSON body if params are absent
  if (!targetId && !targetSlug) {
    try {
      const body = await req.json?.()
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
    return Response.json({ error: message }, { status: 403 })
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
    return Response.json(
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
      return Response.json({ error: 'Article not found.' }, { status: 404 })
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

    return Response.json({
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

    return Response.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 },
    )
  }
}
