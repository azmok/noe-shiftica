import type { CollectionConfig } from 'payload'

/**
 * HostedPages — 「HTMLホスティング」コレクション。
 *
 * CSS / JavaScript を含む 1枚の HTML をそのままホスティングするための入れ物。
 * - title : 管理用のページ名
 * - slug  : 公開 URL（/p/<slug>）。ユーザーが任意に設定
 * - html / css / js : 3分割で保持するソース。配信時に assembleHtmlDocument() で結合
 *
 * コレクション定義は html-file-manager プラグインに倣い、プラグイン配下へ置く
 * （src/collections/* を汚さないため）。
 */

/**
 * /p/<slug> のキャッシュを on-demand purge する。
 * 1. 実行環境（ローカル or 本番）の Next フルルートキャッシュを revalidatePath で破棄。
 * 2. ローカル編集でも本番へ反映させるため、本番の /api/revalidate Webhook も叩く。
 *    （本番上での実行時は self-fetch になるが、重複 purge は無害）
 */
async function revalidateHostedPage(slug: string): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/p/${slug}`)
  } catch (err) {
    console.warn(
      `[HostedPages Hook] local revalidate skipped (likely outside Next.js server): ${(err as Error).message}`,
    )
  }

  try {
    const secret = process.env.REVALIDATE_SECRET
    if (!secret) return
    const origin = process.env.NEXT_PUBLIC_SERVER_URL || 'https://noe-shiftica.com'
    await fetch(`${origin}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, slug, collection: 'hosted-pages' }),
    })
  } catch (e) {
    console.error('[HostedPages Hook] revalidate webhook error:', e)
  }
}

/** スラッグを URL セーフな形へ正規化する */
function normalizeSlug(input: string): string {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const HostedPagesCollection: CollectionConfig = {
  slug: 'hosted-pages',
  labels: {
    singular: 'HTMLホスティング',
    plural: 'HTMLホスティング',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description: 'CSS/JS を含む HTML をアップロード、または直接編集して /p/<slug> で公開します。',
  },
  access: {
    // 公開ページの配信ルートはローカル API（overrideAccess）で読むため必須ではないが、
    // 既存 html-files に合わせて読み取りは公開する。作成・更新・削除は既定（要認証）。
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data.slug === 'string') {
          data.slug = normalizeSlug(data.slug)
        }
        return data
      },
    ],
    // 公開 HTML（/p/<slug>）は ISR でキャッシュ配信される（route.ts: revalidate=86400）。
    // 編集・削除のたびに該当パスを on-demand 再検証して、Next のフルルートキャッシュと
    // App Hosting の CDN エッジを同時に purge する（Posts.ts と同じ運用）。
    afterChange: [
      async ({ doc, operation }) => {
        if (operation !== 'create' && operation !== 'update') return doc
        if (!doc?.slug) return doc
        await revalidateHostedPage(doc.slug as string)
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        if (doc?.slug) await revalidateHostedPage(doc.slug as string)
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'ページ名',
      admin: {
        description: '管理画面の一覧表示用の名前です（公開ページの <title> にも使われます）。',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'スラッグ（URL）',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: '公開 URL の末尾。英小文字・数字・ハイフンのみ。例: my-landing-page',
      },
      validate: (value: string | string[] | null | undefined) => {
        const v = typeof value === 'string' ? value : ''
        if (!v) return 'スラッグは必須です。'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) {
          return '英小文字・数字・ハイフンのみ使用できます。'
        }
        return true
      },
    },
    {
      // 公開 URL 表示＋コピーボタン（保存対象でない UI フィールド）
      name: 'hostingUrl',
      type: 'ui',
      admin: {
        components: {
          Field: '@/plugins/html-hosting/components/HostingUrlField#HostingUrlField',
        },
      },
    },
    {
      // 3分割 Monaco エディタ本体。css / js も同コンポーネント内で編集する。
      name: 'html',
      type: 'textarea',
      label: 'HTML',
      admin: {
        components: {
          Field: '@/plugins/html-hosting/components/HostingEditor#HostingEditor',
        },
      },
    },
    {
      name: 'css',
      type: 'textarea',
      label: 'CSS',
      admin: { hidden: true },
    },
    {
      name: 'js',
      type: 'textarea',
      label: 'JavaScript',
      admin: { hidden: true },
    },
  ],
}
