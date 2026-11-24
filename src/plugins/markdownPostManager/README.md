# markdownPostManager — Markdown 記事を DB で持ち、そのまま表示する

設計書: [`docs/markdown-render-mode.md`](../../../docs/markdown-render-mode.md)

noe-posts の `.md` を、ローカルプレビュー（Textastic など）と同じ見た目で出すためのプラグイン。
`renderMode === 'markdown'` の記事だけ、Lexical ではなく `markdownSource` を markdown-it で HTML にして表示する。
`content`（Lexical）は今まで通り保存するので、読了時間・OG・検索・管理画面の編集は変わらない。

| ファイル | 役割 |
|---|---|
| `index.ts` | プラグイン本体。`renderMode` / `markdownSource` / `markdownMedia` を追加（`customAssets` と同じ方式） |
| `render.ts` | `renderMarkdownArticle(source, media)` → `{ html, headings }`。サーバーでもブラウザでも動く |
| `prepare.ts` | 保存前の前処理（`<link>` / `_assets` の `<script>` / 冒頭 `<h1>` / コメントを落とす）、本文画像の収集 |
| `scopeCss.ts` | `article.css`（上書き）の全セレクタに `#article-page` を付ける（`html`/`body`/`:root` → `#article-page`）。ID 付きなのでサイトの CSS より必ず強く、ナビ・フッターには届かない |
| `build-md-assets.ts` | `pnpm md-assets:build` → `public/md-assets/md/article.scoped.css`（コミットする。ズレはテストが検出） |
| `MarkdownBody.tsx` | 本文コンテナ（`.md-render` / `data-md-root`）と共通 JS の読み込み。サイト本物の本文の囲み（prose / postContent）の中に置かれる |

## 共通アセット（`public/md-assets/`）

正本は noe-shiftica 側。noe-posts の `_assets/` はその写し（自動同期）。
`md-ui.js` / `term-note.js` は、本文コンテナ `[data-md-root]` があればそこを使い、無ければ（ローカルプレビュー）従来どおり `article` / `main` / `body` を探す。
記事の見た目は `article.css` 1枚（サイトの記事デザイン＋ai-box などの部品）。**正本は noe-posts の `_assets/md/article.css`** で、noe-posts の main で変わると Action が noe-shiftica にプルリクエストを出す（`public/md-assets/` の更新と `article.scoped.css` の再生成まで済ませた状態）。手で変えるときも `pnpm md-assets:build` で `article.scoped.css` を作り直して一緒にコミットする。

## 注意

- 本文 HTML は `dangerouslySetInnerHTML` で出す。書き込めるのは api-clients のキーを持つ人と管理画面のユーザーだけ、という前提。
- 列を追加するので、**コードをマージする前に**マイグレーションを流すこと（`pnpm db:migrate:https --dry-run` → 承認 → 本実行）。

## 記事ページの見た目の仕組み（「本物＋上書き」）

- 土台はサイト本物の CSS（Tailwind・prose・`PostArticle.module.css`）。Markdown 記事の本文も、既存記事と同じ本文の囲みの中で描く。
- その上に `article.scoped.css`（`#article-page` 付きに変換した `article.css`）を、記事ページ全体で最後に重ねる（`PostArticle.tsx`）。
- `article.css` の中身：変数／Markdown を既存記事と同じ見た目にする補正（表・引用・コードブロック。`:where(.md-render, …)` で Markdown 本文だけに限定）／ai-box などの部品／GUI エディタの追加分。
- 記事ページの部品には名前が付いている：`.article-hero` `.article-title` `.article-meta` `.article-insights` `.article-toc` `.article-body` `.article-tags` `.article-nav` `.article-card` `.article-toc-sidebar`（`data-slot` は手元の本番そっくりプレビューが中身を差し込む目印）。
- 既存記事（Lexical）には、上書き CSS を足しても見た目が変わらないことを確認済み（本番 2 記事 × デスクトップ / モバイルで計算済みスタイルの差分 0）。
- `textastic.css` は Textastic のプレビュー専用（本番では読まない）。

## 上書きガード（`revision.ts`）
公開済みの記事は DB が正本。Git（noe-posts）からの上書きで DB の新しい内容を消さないための仕組み。
- `markdownRevision`：`markdownSource` から計算する版の印（改行コードと末尾の空白行の違いは無視）。保存のたびに field hook で入る。
- `/api/ai/posts` は、公開済みの記事に Markdown が送られてきたとき `checkGitOverwrite()` で判定する。受け入れるのは、同じ内容の再送か、frontmatter の `baseRevision` が DB の今の版と一致するときだけ。それ以外は 409（`code: "db-is-newer"`）。
- 公開前の記事（下書き）は、今までどおり Git 側が上書きする。
- 詳しくは `docs/markdown-post-manager-and-style-editor.md` §2.4。

## 管理画面の Markdown エディタ（`admin/`、フェーズ2）
`markdownSource` の欄を差し替える（`admin/MarkdownEditorField.tsx`）。
- 左に Markdown、右にプレビュー。「MD / 並べて / プレビュー」の切り替えと全画面。スクロールは原文の行番号で連動し、表示を切り替えても同じ場所を開く。
- プレビューは本物の下書きプレビューページ（`/dev|blog/<slug>/preview`）を iframe で開き、本文（`[data-md-root]`）だけを入力中の Markdown で差し替える（`admin/previewController.ts`。React 非依存）。未保存などでページが無いときは、上書き CSS だけの簡易表示。
- プレビューの段落・見出し・表のセルをクリックすると、その場で書き換えられる（Enter で確定 / Shift+Enter で改行 / Esc で取り消し、太字・斜体・コード・リンク）。書き戻しは `admin/blockEdit.ts`（noe-posts の Netlify エディタと同じ規則）。行番号は `renderMarkdownArticle(..., { sourceMap: true })` が付ける `data-src` / `data-row` / `data-col`。
- 「画像を追加」で Media にアップロードし、`markdownMedia` に登録して本文に `![](./ファイル名)` を入れる。本文が使っているのに `markdownMedia` に無い画像は、欄の下に警告を出す。
- 保存すると `contentSync.ts` の beforeChange フックが `content`（Lexical。検索・読了時間・OG 用）を作り直す。`/api/ai/posts` は自分で作るので `req.context.markdownContentProvided` で飛ばす。
