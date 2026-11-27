# 設計書：Markdown そのまま表示モード（`markdownRender` プラグイン）

- 状態：**承認待ち**（保護ファイルとマイグレーションを伴うため、承認までコードは書かない）
- 起票：2026-11-24 / 依頼者：あずま
- 関連：`HANDOFF_noe-posts-workflow.md` Phase 2

---

## 1. 何を解決するか（全体像）

noe-posts の `.md` を、Textastic / Working Copy のローカルプレビューと**同じ見た目**で本番に出す。

今の流れは「Markdown → Lexical（エディタ用 JSON）→ HTML」。この Lexical 変換が、次の2つを壊している（Phase 0 で再現済み）。

| 入力 | 現状の出力 |
|---|---|
| `<div class="ai-box">` の中に空行を挟んだ Markdown | 丸ごと生 HTML 扱い。`- **太字**` や `[x](url)` が記号のまま出る |
| 段落の中の `<button class="term" …>用語</button>` | タグがただの文字列になる |

Lexical は「Markdown の中に混ざった HTML」を扱えない。だから**表示だけ**を `markdown-it`（CommonMark 準拠）に切り替える。Lexical の `content` は今まで通り作って保存する。

読了時間・OG 生成・検索・管理画面の編集など、`content` に依存する既存機能は一切変わらない。

```
.md ─▶ /api/ai/posts ─┬─▶ content（Lexical）……従来どおり生成・保存（検索・読了時間・管理画面用）
                      └─▶ markdownSource ……前処理済みの原文を保存（表示用）

表示：renderMode === 'markdown' なら markdownSource を markdown-it で HTML にして出す
      それ以外（既存記事すべて）は今までの Lexical 描画
```

---

## 2. 変更の一覧

| 区分 | 対象 | 保護ファイル？ |
|---|---|---|
| 新規 | `src/plugins/markdownRender/`（プラグイン本体・描画・CSS スコープ・テスト・README） | いいえ |
| 編集 | `src/payload.config.ts`：`plugins` に `markdownRenderPlugin(...)` を1行追加＋import | **はい（承認が必要）** |
| 新規 | `src/migrations/2026MMDD_…_add_markdown_render.ts`、`src/migrations/index.ts` に登録 | いいえ（DB 変更は別途承認） |
| 編集 | `src/plugins/ai-api/endpoints/posts.ts`、`src/plugins/markdownImport/frontmatter.ts` | いいえ |
| 編集 | `src/app/(frontend)/blog/[slug]/PostArticle.tsx` | いいえ |
| 編集 | `scripts/publish-article.mjs` | いいえ |
| 新規 | `public/md-assets/`（共通 CSS / JS / アイコン） | いいえ |

**`src/collections/*` は編集しない。** `customAssets` プラグインと同じ方式（プラグインが `config.collections` に `fields` を足す）で、`posts` と `tech-posts` に列を追加するため。

---

## 3. データ設計

`posts` と `tech-posts` の両方に、プラグインが次のフィールドを足す。

| フィールド | 型 | 内容 |
|---|---|---|
| `renderMode` | text（既定 `'lexical'`） | `'lexical'` か `'markdown'`。未設定・不明な値は `'lexical'` 扱い |
| `markdownSource` | textarea | 前処理済みの Markdown 原文（frontmatter は除く） |
| `markdownMedia` | json | 本文画像のファイル名 → `{ id, url }` の対応表 |

**`renderMode` を select ではなく text にする理由**：Payload の select は Postgres の enum 型を作る。バージョン用テーブルの enum も含めて名前が長くなり、マイグレーションが壊れやすい。text なら `ADD COLUMN` だけで済む。値の検証は `validate` で行う。

**`markdownMedia` に URL も持たせる理由**：描画のたびに media を引き直さず、1回の取得で表示できる。デメリットは、画像のホスト先を変えたときに再投稿が必要になること。画像は記事ごとに再アップロードされる運用なので許容する。

管理画面では、`markdownSource` と `markdownMedia` を `readOnly`、`renderMode` が `'markdown'` のときだけ表示する（`admin.condition`）。原稿の正本は noe-posts 側にあり、管理画面で直接編集しない運用のため。

### マイグレーション

`posts` / `tech_posts` / `_posts_v` / `_tech_posts_v`（バージョン側は `version_` 接頭辞）の4テーブルに、各3列を追加する。`IF NOT EXISTS` で冪等にし、`db.execute(sql\`…\`)` だけで書く（`pnpm db:migrate:https` で流せる形）。

```sql
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "render_mode" varchar DEFAULT 'lexical';
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "markdown_source" varchar;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "markdown_media" jsonb;
-- tech_posts も同様
ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_render_mode" varchar DEFAULT 'lexical';
ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_markdown_source" varchar;
ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_markdown_media" jsonb;
-- _tech_posts_v も同様
```

**順序（厳守）**：`--dry-run` で SQL をあずまに見せる → OK → 本実行 → **そのあと**コードをマージする。逆だと記事取得がエラーになる。事前の DB バックアップブランチ（DB Sanctuary）は、このクラウド環境に手順書（`.antigravity/`）が無いので、**手順をあずまに確認する**。

---

## 4. 描画

### 4-1. 関数 `renderMarkdownArticle(source, media)`

純粋な関数（Node でもブラウザでも動く）にする。`PostArticle` は管理画面の Live Preview から**クライアント側**でも描画されるため、サーバー専用にはできない。

処理は次の順。

1. `markdown-it`（`html: true`, `linkify: true`, `typographer: false`）で HTML にする。空行を挟んだ `<div>` 内の Markdown も、CommonMark の規則で正しく変換される。追加プラグインは入れない。
2. 見出しに `id` を付ける。既存の `slugifyHeading`（`articleToc/headings.ts`）をそのまま使い、重複は `-2`, `-3` で避ける。
3. URL を書き換える。
   - `(../)+_assets/…` → `/md-assets/…`（`img src` / `link href` / `script src` すべて）
   - `./xxx.png` → `markdownMedia` の URL
4. `{ html, headings }` を返す。

**目次は Lexical ではなく、この `headings` から作る。** Lexical 側では `<div>` 内の見出しがコードブロックに入ってしまい、目次から漏れるため。`ArticleToc` / `ArticleTocSidebar` は `ArticleHeading[]` を受け取る既存の形のまま使える。

### 4-2. 前処理（API 側で保存前に行う）

`prepareArticleMarkdown` と同じ考え方で、保存する `markdownSource` から次を落とす（本番では無意味、または二重になるため）。

- 冒頭の `<link rel="stylesheet">` と `<script src>`（共通アセットはページ側が読み込む）
- 冒頭の `<h1>`（タイトルはページ側が出す）
- 行頭の HTML コメント

`_assets` パスの書き換えは保存時ではなく**描画時**に行う。原稿を元の形に近いまま持てて、パス規則を変えても再投稿で済むため。

### 4-3. 見た目を揃える部分

**CSS の閉じ込め。** `ini.md.css` は `html` / `body` / `h1` / `table` などのグローバルなセレクタを含む。そのまま読み込むとサイトのヘッダーとフッターまで変わる。そこで、描画コンテナ（`.md-render`）を `@scope` で囲む。

- `customAssets` が既に `@scope` を使っているので、ブラウザ要件は増えない（Safari 17.4+）。
- ただし `@scope` の中では `html` / `body` / `:root` のセレクタは**何にもマッチしない**（祖先だから）。だから `html`・`body`・`:root` は `:scope` に書き換える。
- この変換は `scopeMarkdownCss(css)` という純粋関数にして、単体テストする。
- 変換結果は `<style>` としてインライン出力する（サーバーでファイルを1回読んでメモリに持つ）。

**JS。** `md-ui.js` は `article` / `main` / `body` をルートとして探す。サイトの DOM では記事本文を確実に掴めないため、コンテナに `data-md-root` を付け、**JS 側で `[data-md-root]` を優先する**ように足す。`data-md-root` が無い場合は今まで通りの探し方にフォールバックするので、ローカルプレビューの挙動は変わらない。

`touch-action: manipulation` などの html / body 向け指定は、`:scope`（= 本文コンテナ）に移る。本文外のタップ挙動は変わらない。**本文に限定してよいかは、ファイルを受け取ってから確認する。**

**⚠️ 未確認の点。** `term-note.js` / `md-ui.js` が「初回に DOM を1回走査する」作りなのか、再初期化できる作りなのかは、ファイルを見ていないので**不明**。Live Preview で本文が差し替わったときに再バインドが要るかは、受け取り後に決める。

### 4-4. `PostArticle.tsx` の切り替え

`post.renderMode === 'markdown' && post.markdownSource` のときだけ、モバイル版（約 376 行目）とデスクトップ版（約 531 行目）の2か所の `RichText` を、`<MarkdownBody>` に差し替える。同じ分岐が、`dev` / `blog` の通常ページ、preview ページ、`LivePreview` のすべてに効く（どれも `PostArticle` を通るため）。

それ以外（既存記事すべて）は分岐に入らないので、**表示は1ピクセルも変わらない。**

HTML をそのまま埋め込む（`dangerouslySetInnerHTML`）。本文を書けるのは、書き込み権限のある `api-clients` のキー（あずまだけ）と管理画面のユーザーだけ。この前提が崩れる（他人にキーを渡す等）ときは、サニタイズの追加が必要になる。

---

## 5. API とクライアント

### `/api/ai/posts`

- リクエストに `renderMode: 'markdown'` を追加する。
- `'markdown'` のとき：前処理した原文を `markdownSource` に、画像の対応表を `markdownMedia` に保存し、`content` は**今まで通り生成する**。
- 画像：今の `referencedImages` は「独立行の `![alt](./file)`」だけを拾う。ai-box の中や `<img src="./…">` の画像も拾えるように、`markdown` モードでは**本文中の相対パス画像をすべて**拾う。`_assets` 配下は共通アセットなので対象外。
- `publishExistingDraft`（`{slug, status}` だけで公開）は、`renderMode` を含む下書きの全フィールドをそのままコピーするので、変更不要。

### `frontmatter.ts`

`status` を `KNOWN_FRONTMATTER_FIELDS` に足し、`customMetaData` に入らないようにする（Action が使うだけのキー）。`author` は今まで通り `customMetaData` に入る。

### `publish-article.mjs`

- `--render markdown` を追加する。
- `--status published` を追加する。**`draft` コマンドに本文ごと送る形で公開できる。** API は元から `markdown` と `status: "published"` を同時に受け付けるので、サーバー側の変更は要らない。
- 既存の `publish <slug>` は、そのまま残す。

---

## 6. テスト

vitest（unit）。

- ai-box 内の Markdown（箇条書き・太字・リンク・コード）が HTML になる
- 段落内の `<button class="term">` がそのまま残る
- `table-scroll` ラッパーが残る
- `_assets` パスの書き換え、`./xxx.png` → media URL の書き換え
- 見出しの `id` と、目次用 `headings` が `slugifyHeading` と一致する
- `scopeMarkdownCss`：`html` / `body` / `:root` が `:scope` になる、`@media` の中も変換される、カンマ区切りのセレクタ
- `renderMode` 未指定・`'lexical'` の記事は従来どおり
- API：`renderMode: 'markdown'` で `markdownSource` / `markdownMedia` / `content` が揃う

そのほか：`pnpm lint` / tsc / 既存テストが通ること。UTF-8・NUL 0 の確認。可能なら Playwright で iPad サイズ（820×1180）を撮影して比較する。

---

## 7. 実装の順序

1. （承認）この設計書
2. プラグインと描画関数とテスト（DB にも保護ファイルにも触れない）
3. （承認）`payload.config.ts` の登録を1行追加
4. （承認）マイグレーションを `--dry-run` → 本実行
5. API・`PostArticle`・`publish-article.mjs`・`frontmatter.ts`
6. 共通アセット（`public/md-assets/`）。ファイルの受け取り後
7. コードのマージは、**4 のあと**

---

## 8. あずまに決めてほしいこと

1. **`renderMode` を text にする方針**（§3）。select（enum）でなく text でいい？ → 推奨：text
2. **`markdownMedia` に URL も保存する方針**（§3）でいい？ → 推奨：保存する
3. **DB バックアップ**：（2026-11-27 追記：解決済み。手順は ai-brains の `projects/noe-shiftica/rules/procedures/backup.md` に移り、クラウドからも読める）このクラウド環境に `.antigravity/` が無く、DB Sanctuary の手順が読めない。バックアップブランチの作り方を教えてほしい（またはあずまが先に取る）。
4. **共通アセットの置き場所**：`public/md-assets/` が正本で、noe-posts の `_assets/` がその写し、という整理で合ってる？（指示書どおり）
5. **Phase 3（下書きプレビューの保護）**は、この設計書の外。A（Payload ログイン時のみ）か B（`?token=` + `PREVIEW_SECRET`）は、Phase 2 の実装後に改めて聞く。
