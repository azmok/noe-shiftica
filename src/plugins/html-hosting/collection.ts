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
