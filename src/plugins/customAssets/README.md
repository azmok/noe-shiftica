# Custom Assets Plugin

記事ごとのカスタム CSS / JS を扱うプラグイン。General（`posts`）と Dev（`tech-posts`）の両方で使える。

## 登録するもの
- 指定したコレクションに `customCss` / `customJs`（textarea）を追加する（`index.ts`）。`payload.config.ts` の `plugins` で `customAssetsPlugin({ collections: ['posts', 'tech-posts'] })` として登録する。
- 値の入り口は2つ：
  - 管理画面の Markdown インポート（`.md` と一緒に `.css` / `.js` をアップロードすると、それぞれの欄に入る）
  - `/api/ai/posts` の `customCss` / `customJs`

## 表示
`ArticleCustomAssets.tsx` を記事ページ（`PostArticle.tsx`）で使う。
- CSS は `@scope (#article-<id>) { ... }` で包むので、記事の外（他の記事やサイト共通の UI）には効かない。
- JS は本物の `<script>` として挿入する。記事本文の描画が落ち着いてから（150ms 変化がなくなってから）1回だけ実行する。

## DB
- `posts` の `custom_css` / `custom_js` は以前からある列。
- `tech-posts` の列は `src/migrations/20261019_103452_add_tech_posts_custom_assets.ts` で追加する。**このプラグインを本番に出す前に、本番 DB でマイグレーションを流すこと**（`pnpm db:migrate`）。
