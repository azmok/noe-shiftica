# markdownRender — Markdown そのまま表示

設計書: [`docs/markdown-render-mode.md`](../../../docs/markdown-render-mode.md)

noe-posts の `.md` を、ローカルプレビュー（Textastic など）と同じ見た目で出すためのプラグイン。
`renderMode === 'markdown'` の記事だけ、Lexical ではなく `markdownSource` を markdown-it で HTML にして表示する。
`content`（Lexical）は今まで通り保存するので、読了時間・OG・検索・管理画面の編集は変わらない。

| ファイル | 役割 |
|---|---|
| `index.ts` | プラグイン本体。`renderMode` / `markdownSource` / `markdownMedia` を追加（`customAssets` と同じ方式） |
| `render.ts` | `renderMarkdownArticle(source, media)` → `{ html, headings }`。サーバーでもブラウザでも動く |
| `prepare.ts` | 保存前の前処理（`<link>` / `_assets` の `<script>` / 冒頭 `<h1>` / コメントを落とす）、本文画像の収集 |
| `scopeCss.ts` | `article.css` を `@scope (.md-render)` に閉じ込める（`html`/`body`/`:root` → `:scope`） |
| `build-md-assets.ts` | `pnpm md-assets:build` → `public/md-assets/md/article.scoped.css`（コミットする。ズレはテストが検出） |
| `MarkdownBody.tsx` | 本文コンテナ（`data-md-root`）と共通 CSS / JS の読み込み |

## 共通アセット（`public/md-assets/`）

正本は noe-shiftica 側。noe-posts の `_assets/` はその写し（自動同期）。
`md-ui.js` / `term-note.js` は、本文コンテナ `[data-md-root]` があればそこを使い、無ければ（ローカルプレビュー）従来どおり `article` / `main` / `body` を探す。
記事の見た目は `article.css` 1枚（サイトの記事デザイン＋ai-box などの部品）。**正本は noe-posts の `_assets/md/article.css`** で、noe-posts の main で変わると Action が noe-shiftica にプルリクエストを出す（`public/md-assets/` の更新と `article.scoped.css` の再生成まで済ませた状態）。手で変えるときも `pnpm md-assets:build` で `article.scoped.css` を作り直して一緒にコミットする。

## 注意

- 本文 HTML は `dangerouslySetInnerHTML` で出す。書き込めるのは api-clients のキーを持つ人と管理画面のユーザーだけ、という前提。
- 列を追加するので、**コードをマージする前に**マイグレーションを流すこと（`pnpm db:migrate:https --dry-run` → 承認 → 本実行）。
