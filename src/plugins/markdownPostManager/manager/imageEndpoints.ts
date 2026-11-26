import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import { isHumanUser } from '../../api-clients/permissions'
import { decryptSecret, isOpenAIKey, SETTINGS_SLUG } from './settings'

const response = (data: object, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const error = (message: string, status: number) => response({ message }, status)

const MODEL = 'gpt-image-1.5'
const MAX_IMAGE = 5 * 1024 * 1024
const generating = new Set<string>()

async function credentials(req: PayloadRequest) {
  const config = await req.payload.findGlobal({ slug: SETTINGS_SLUG, overrideAccess: true, depth: 0 })
  const stored = config as { openaiKeyEncrypted?: string; openaiKeyHint?: string }
  if (stored.openaiKeyEncrypted) {
    try {
      return { key: decryptSecret(stored.openaiKeyEncrypted), hint: stored.openaiKeyHint, source: 'settings' }
    } catch {
      // A key encrypted with a previous PAYLOAD_SECRET must be entered again.
      return { key: null, hint: null, source: null }
    }
  }
  const key = process.env.OPENAI_API_KEY?.trim()
  return { key: key || null, hint: null, source: key ? 'environment' : null }
}

const keyStatus: PayloadHandler = async (req) => {
  if (!isHumanUser(req.user)) return error('管理画面にログインしてください', 401)
  const { key, hint, source } = await credentials(req)
  return response({ configured: Boolean(key), hint, source })
}

async function input(req: PayloadRequest, limit: number): Promise<Record<string, unknown> | Response> {
  if (!isHumanUser(req.user)) return error('管理画面にログインしてください', 401)
  if (!req.headers.get('content-type')?.startsWith('application/json') ||
      req.headers.get('x-mpm-request') !== '1' ||
      ['cross-site', 'same-site'].includes(req.headers.get('sec-fetch-site') ?? '')) {
    return error('Markdown Post Manager から操作してください', 403)
  }
  if (Number(req.headers.get('content-length')) > limit) return error('送信内容が大きすぎます', 413)
  try {
    const raw = await req.text?.()
    if (!raw || raw.length > limit) return error('送信内容が大きすぎるか空です', 413)
    const data: unknown = JSON.parse(raw)
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>
  } catch {
    // The request contains no usable JSON.
  }
  return error('送信内容を読み取れませんでした', 400)
}

const saveKey: PayloadHandler = async (req) => {
  const data = await input(req, 2048)
  if (data instanceof Response) return data
  const key = typeof data.key === 'string' ? data.key.trim() : ''
  if (!isOpenAIKey(key)) return error('OpenAI の API キーを確認してください', 400)
  try {
    await req.payload.updateGlobal({
      slug: SETTINGS_SLUG,
      data: { openaiKey: key },
      overrideAccess: false,
      req,
    })
    return response({ configured: true, hint: '…' + key.slice(-4), source: 'settings' })
  } catch {
    return error('キーを保存できませんでした。管理者に連絡してください', 500)
  }
}

function webp(value: unknown): Buffer | null {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_IMAGE / 3) * 4 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null
  const bytes = Buffer.from(value, 'base64')
  return bytes.length <= MAX_IMAGE && bytes.subarray(0, 4).toString() === 'RIFF' &&
    bytes.subarray(8, 12).toString() === 'WEBP' ? bytes : null
}

function openAIError(status: number) {
  if (status === 401) return error('OpenAI のキーを確認し、設定し直してください', 401)
  if (status === 403) return error('OpenAI のプロジェクトで画像生成・編集の権限とモデルへのアクセスを確認してください', 403)
  if (status === 429) return error('OpenAI の利用上限またはリクエスト制限に達しました。プロジェクトの利用状況を確認してください', 429)
  if (status === 400) return error('OpenAI が指示を受け付けませんでした。内容を変えてお試しください', 400)
  return error('OpenAI から画像を受け取れませんでした。時間をおいてお試しください', 502)
}

const generate: PayloadHandler = async (req) => {
  const data = await input(req, Math.ceil(MAX_IMAGE / 3) * 4 + 64_000)
  if (data instanceof Response) return data
  const { prompt, context, kind, previous } = data
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2000 ||
      typeof context !== 'string' || context.length > 6000 ||
      (kind !== 'hero' && kind !== 'body')) return error('画像の用途と指示を確認してください', 400)
  const reference = previous === undefined ? null : webp(previous)
  if (previous !== undefined && !reference) return error('前の画像を読み取れませんでした', 400)

  const userId = String((req.user as { id?: unknown }).id ?? 'admin')
  if (generating.has(userId)) return error('前の画像ができるまでお待ちください', 409)
  generating.add(userId)
  try {
    const { key } = await credentials(req)
    if (!key) return error('先に OpenAI API キーを設定してください', 412)
    const options = {
      model: MODEL,
      size: '1536x1024',
      quality: 'medium',
      output_format: 'webp',
      prompt: [
        kind === 'hero' ? 'Create a landscape editorial hero image for this article.' : 'Create a landscape illustration for this article section.',
        'Use the article excerpt as background only. Follow the user’s visual direction.',
        'Article excerpt:', context, 'Visual direction:', prompt.trim(),
      ].join('\n'),
    }
    let body: BodyInit = JSON.stringify(options)
    if (reference) {
      const form = new FormData()
      Object.entries(options).forEach(([name, value]) => form.set(name, value))
      form.set('image', new Blob([new Uint8Array(reference)], { type: 'image/webp' }), 'previous.webp')
      body = form
    }
    const upstream = await fetch('https://api.openai.com/v1/images/' + (reference ? 'edits' : 'generations'), {
      method: 'POST',
      redirect: 'error',
      headers: { Authorization: 'Bearer ' + key, ...(reference ? {} : { 'Content-Type': 'application/json' }) },
      body,
      signal: AbortSignal.timeout(180_000),
    })
    if (!upstream.ok) return openAIError(upstream.status)
    const result = await upstream.json()
    const image = result?.data?.[0]?.b64_json
    if (!webp(image)) return error('生成画像を読み取れませんでした', 502)
    return response({ image })
  } catch {
    return error('画像生成との通信が途切れました。時間をおいてお試しください', 502)
  } finally {
    generating.delete(userId)
  }
}

export const imageEndpoints: Endpoint[] = [
  { path: '/mpm/image-settings', method: 'get', handler: keyStatus },
  { path: '/mpm/image-settings', method: 'post', handler: saveKey },
  { path: '/mpm/images', method: 'post', handler: generate },
]
