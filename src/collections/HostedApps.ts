import type { CollectionConfig } from 'payload'

// Single-file HTML (SPA) hosting.
// Unlike the `html-files` embed flow (which extracts <body>/<style> and injects it
// into an article via dangerouslySetInnerHTML — where <script> never runs), this
// collection stores the *entire* HTML document verbatim in the DB and serves it as-is
// from a dedicated public route (`/apps/<slug>`) with `Content-Type: text/html`.
// The browser therefore loads it as a real document, so head <script> tags and all
// JavaScript run natively. Intended for self-contained single-file apps (e.g. an
// "AI benchmark table") linked to from blog articles.
export const HostedApps: CollectionConfig = {
  slug: 'hosted-apps',
  labels: {
    singular: 'ホスティングHTML (SPA)',
    plural: 'ホスティングHTML (SPA)',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'published', 'updatedAt'],
    description:
      'JavaScriptを含む1枚完結のHTML(SPA)を丸ごとホスティングします。公開後は /apps/<slug> でそのまま表示され、JSがネイティブに動作します。',
  },
  access: {
    // Public REST/GraphQL reads are limited to published docs; authenticated admins see all.
    // The public serving route (/apps/<slug>) uses overrideAccess and additionally gates on `published`.
    read: ({ req }) => {
      if (req.user) return true
      return { published: { equals: true } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'タイトル',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: '公開スラッグ (URL)',
      admin: {
        description: '公開URL: /apps/<slug>（小文字英数字とハイフンのみ）',
      },
      validate: (val: string | string[] | null | undefined) => {
        const value = Array.isArray(val) ? val[0] : val
        if (!value) return 'スラッグは必須です'
        return /^[a-z0-9-]+$/.test(value) || '小文字英数字とハイフン (-) のみ使用できます'
      },
    },
    {
      name: 'html',
      type: 'textarea',
      required: true,
      label: 'HTML本体',
      admin: {
        description: '1枚完結のHTMLファイルの中身。下のボタンから .html を読み込むか、直接貼り付けます。',
        components: {
          Field: '@/components/HostedAppHtmlField#HostedAppHtmlField',
        },
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      label: '公開する',
      admin: {
        position: 'sidebar',
        description: 'チェックすると /apps/<slug> で一般公開されます。',
      },
    },
  ],
}
