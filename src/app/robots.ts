import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/_payload',
        '/api',
        '/next-api',
        // タグ一覧は編集者がタグを足すたびに増える薄い自動生成インデックス。
        // sitemap から外す（sitemap.ts）だけでなくクロール自体も抑止して、
        // 低品質な重複リスティングがインデックスされるのを防ぐ。
        '/blog/tag/',
        '/dev/tag/',
        // ログイン画面。検索結果に出る意味がなく、各ページの noindex も無いため塞ぐ。
        '/2fa-login',
        // 下書きプレビュー。各ページで noindex 済みだが多層防御として明示的に拒否。
        '/blog/*/preview',
        '/dev/*/preview',
        // フォーム送信後のサンクスページ。noindex 済みだが念のため拒否。
        '/contact/success',
        // hosted-pages の独立HTML配信。サイトの canonical を持たない非公開配布用。
        '/p/',
      ],
    },
    sitemap: 'https://noe-shiftica.com/sitemap.xml',
  }
}
