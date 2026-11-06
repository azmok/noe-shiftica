# Revised Date Plugin

記事の「更新日」（`revisedAt`）を扱うプラグイン。General（`posts`）と Dev（`tech-posts`）の両方で使える。

## なぜ updatedAt と別に持つのか
`updatedAt` はタグの修正などの細かい保存でも変わる。読者に見せたいのは「内容を更新した日」なので、編集者が決める日付を別に持つ。

## 登録するもの
- 指定したコレクションに `revisedAt`（date・管理画面のラベルは「更新日」）を追加する（`index.ts`）。`payload.config.ts` の `plugins` で `revisedDatePlugin({ collections: ['posts', 'tech-posts'] })` として登録する。
- 値の入り口は frontmatter の `updated:`（`markdownImport/frontmatter.ts` の `revisedAtFromFrontmatter`）：
  - 管理画面の Markdown インポート
  - `/api/ai/posts`
  - `updated: null` で空に戻す。キーを書かなければ今の値のまま

## 表示
`displayedUpdate(post)` を記事ページ（`PostArticle.tsx`）冒頭の「Updated」（「Published」の隣。/blog・/dev 共通、モバイル・デスクトップ両方）で使う。`revisedAt` があればそれを日付だけで表示し、空なら `updatedAt` を日時で表示する。ただし `updatedAt` は公開日と別の日（JST）のときだけ（公開当日の保存やタグ修正では出さない）。構造化データ（`BlogPostingJsonLd`）の `dateModified` も `revisedAt` を優先する。

## DB
列は `src/migrations/20261026_080000_add_revised_at.ts` で追加する。**このプラグインを本番に出す前に、本番 DB でマイグレーションを流すこと**（`pnpm db:migrate`）。
