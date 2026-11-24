# 設計書：markdownPostManager / styleEditor プラグイン

> 状態：草案（2026-11-25）。あずまの確認待ち。実装はフェーズ単位で、各フェーズの前に確認する。

## 0. 決まったこと

| 項目 | 決定 |
|---|---|
| 記事の正本 | **DB（Payload）**。noe-posts は「公開前の下書き置き場（入り口）」 |
| 公開後の noe-posts の .md | publish の Action が DB への反映を確認してから**自動で削除**する（Git の履歴には残る） |
| 公開後の編集 | 管理画面で **Markdown のまま**（案 A）。Lexical には変換しない |
| もう一度 Textastic で書きたいとき | 管理画面の「Git に書き出す」で `draft/<slug>` ブランチを作って借りる |
| プラグインの分け方 | `markdownPostManager`（記事）と `styleEditor`（見た目）の2本。styleEditor は Markdown に依存しない |
| GitHub 連携 | markdownPostManager の**任意機能**（設定でオフにすれば、開発者でないクライアントには普通の Markdown 記事機能として渡せる） |
| 既存の公開済み記事 | DB と同じ slug の .md は noe-posts から削除済み（2026-11-25, `14202c4`）。DB は触っていない |

## 1. 全体の流れ

```
[Textastic / Working Copy]
      │ push（draft/<slug> ブランチ）
      ▼
 noe-posts ──(Actions: draft)──▶ Payload DB（下書き）◀── 管理画面で編集（MD＋プレビュー）
      │ main にマージ                    │
      └──(Actions: publish)──▶ 公開 ──▶ 反映を確認 ──▶ noe-posts から記事フォルダを削除
                                         │
                     「Git に書き出す」◀──┘（DB の最新 → draft/<slug> ブランチ）
```

「持ち主」は常に1つ。

- 公開前は noe-posts が持ち主。
- 公開した瞬間に DB へ移る。
- 書き出すと一時的に noe-posts に貸し出す。戻すときは、上書きガード（§2.4）を通った場合だけ DB に入る。

## 2. markdownPostManager

### 2.1 今あるものからの引っ越し

| 今 | 引っ越し先 |
|---|---|
| `src/plugins/markdownRender/`（`renderMode` / `markdownSource` / `markdownMedia`、描画、scopeCss） | markdownPostManager の中心。そのまま移す |
| `src/plugins/draftPreviewGuard/` | markdownPostManager の下書きプレビュー機能として取り込む（他でも使うなら共通部品のまま） |
| `ai-api` の `POST /api/ai/posts` の Markdown 部分 | 受け口は ai-api に残す。保存処理は markdownPostManager の関数を呼ぶ |
| `markdownImport`（.md → Lexical） | 別物（Lexical 記事用）として残す。Markdown モードの取り込みは markdownPostManager 側 |
| `markdownCopyPlugin` | Lexical 記事用の非常口として残す |
| noe-posts の Netlify エディタの文章編集・MD 表示 | 管理画面の編集画面（§2.3）に React で移植 |

### 2.2 設定（payload.config.ts）

```ts
markdownPostManager({
  collections: ['posts', 'tech-posts'],
  articleRoot: '#article-page',          // 上書き CSS を効かせる範囲
  previewPath: (doc, collection) => `/${collection === 'posts' ? 'blog' : 'dev'}/${doc.slug}/preview`,
  git: {                                  // 省略＝GitHub 連携なし
    repo: 'azmok/noe-posts',
    folders: { 'tech-posts': 'dev', posts: 'blog' },
    tokenEnv: 'NOE_POSTS_TOKEN',          // サーバー側の環境変数（値はあずまが登録）
  },
})
```

### 2.3 管理画面の編集（案 A）

- `renderMode = 'markdown'` の記事では、本文の欄を **Markdown エディタ＋プレビュー（並べて表示・スクロール連動）** に差し替える。
- プレビューには、本番と同じ `renderMarkdownArticle()` の結果を、本番の CSS と一緒に表示する。
- 画像：`markdownMedia` の一覧を出し、追加や差し替えは Payload の Media アップロードで行う。本文には相対パスのまま書く（今の仕組みと同じ）。
- Payload の版の履歴（versions / drafts）をそのまま使う。保存の取り消しや、前の版に戻すのは標準機能でできる。
- 先に `.antigravity/knowledge/backend/admin-ui/custom-field-keyboard-and-shared-json.md` の2つの罠を読んでから作る（Enter キーの横取り、重い `setValue`）。

### 2.4 上書きガード（Git ⇄ DB の衝突を防ぐ）

- 記事に `markdownRevision`（本文と画像一覧のハッシュ）を持たせる。保存するたびに更新する。
- 「Git に書き出す」とき、.md の frontmatter に `baseRevision: <ハッシュ>` を書き込む。
- noe-posts から送られてきた記事は次の順で判定する。
  - DB に無い：新しい記事として作る。
  - DB が公開済みで `baseRevision` が無い：**拒否**（古い .md で上書きしないため）。
  - `baseRevision` が DB の `markdownRevision` と一致：受け入れる。
  - 一致しない（書き出したあとに管理画面でも直した）：**拒否**して、Action のログに「DB の方が新しい。書き出し直して」と出す。
- 下書き（未公開）同士なら、今までどおり Git 側を優先して上書きする。

### 2.5 公開時の自動削除（noe-posts 側の Action）

1. main にマージされたら、`status: published` の記事を送る（今と同じ）。
2. API の返事にある `markdownRevision` と、手元で計算したハッシュを突き合わせる。
3. 一致したら、その記事のフォルダを main から削除してコミットする（`published → DB: <slug> [skip ci]`）。
4. 送信に失敗した、またはハッシュが違ったら**消さない**。Action を失敗させて知らせる。

フォルダに複数の記事がある場合（例：`best-ai-model-comparison-guide-2026-11/`）は、公開した .md と、その記事だけが使っている画像だけを消す。

### 2.6 Git に書き出す

- 管理画面の記事に「Git に書き出す」ボタンを付ける（`git` を設定したときだけ表示）。
- サーバー側で GitHub API を呼ぶ。
  1. `draft/<slug>` ブランチを作る
  2. `<folder>/<slug>/<slug>.md`（frontmatter に `baseRevision`）と、使っている画像を置く
  3. コミットする
- 鍵はサーバーの環境変数だけに置く。ブラウザには出さない。

## 3. styleEditor

### 3.1 何をするか

- **本物のページの上で**、要素をタップして選び、右パネルで CSS をいじる。今の Netlify エディタのスタイルモードを移植する。
- 管理画面にログインした人が、ページを `?style-edit=1` 付きで開いたときだけ編集用の画面が出る。一般の訪問者には出ない。
- 保存先は DB。版の履歴付きなので、前の状態に戻せる。

### 3.2 データ

- コレクション `style-sheets`（versions あり）
  - `name`（例：記事ページ共通）
  - `scope`：`site`（全ページ）／`template`（記事ページなどの型ごと、セレクタの頭に付ける範囲を指定）／`document`（1記事だけ）
  - `rules`：`[{ selector, media: 'all'|'mobile'|'desktop', declarations: [{ prop, value }] }]`
  - `css`：保存時に `rules` から作る CSS（表示用）
- 1記事だけの見た目は、今ある `customAssets`（記事ごとの `customCss`）とかぶる。`scope: document` を作る代わりに、**customAssets の `customCss` に書き込む**方式も選べる → 未決事項 Q2。

### 3.3 表示

- 公開中の `style-sheets` の CSS を、レイアウトで `<style>`（またはキャッシュ付きの CSS ルート）として出す。保存したら revalidate する。
- 読み込み順：サイトの CSS → `article.scoped.css`（Markdown 用の上書き）→ styleEditor の CSS。後から読み込むものほど優先される。

### 3.4 今の noe-posts の仕組みとの関係

- `_assets/md/article.css` の GUI ブロック（`@gui-begin … @gui-end`）の中身は、最初に `style-sheets` に取り込む。
- `article.css` の残り（Markdown を Lexical の見た目に合わせる部分）は、引き続き noe-posts の `_assets/` が正本のまま。Textastic でのプレビューにも使うから。
- styleEditor が動いたら、次の2つは役目を終えるので止める。
  - 見た目のスナップショット（`snapshot-site.yml`）
  - Netlify エディタのスタイルモード
- Netlify エディタは、下書きの文章編集とプレビュー専用に絞る。

## 4. 使い回し（再現性）

- フェーズ 1〜3 は `src/plugins/<name>/` で作る。ただし、サイト固有の値（コレクション名、セレクタ、パス）は**すべて設定で渡す**形にしておく。
- 2つ目のサイトで使う時点で、pnpm workspace の `packages/payload-plugin-markdown-post-manager` / `packages/payload-plugin-style-editor` に切り出す（フェーズ 5）。

## 5. フェーズ

進み具合（2026-11-25）：フェーズ1 完了（#29）／フェーズ2 完了（管理画面の MD エディタ＋プレビュー＋クリック編集。Q1 の答え「クリック編集も入れる」を反映）。

| # | 内容 | DB の変更 | noe-posts の変更 |
|---|---|---|---|
| 1 | markdownPostManager の土台：markdownRender などを引っ越し、`markdownRevision` を追加、上書きガード | 列追加（マイグレーション：dry-run → 承認 → 本実行 → マージ） | — |
| 2 | 管理画面の MD エディタ＋プレビュー（案 A） | — | — |
| 3 | 公開時の自動削除（Action）＋「Git に書き出す」 | — | publish.yml 変更。環境変数 `NOE_POSTS_TOKEN` はあずまが登録 |
| 4 | styleEditor（コレクション、本物ページでの編集画面、CSS の出力） | テーブル追加（マイグレーション） | GUI ブロックを取り込んだあと、snapshot を停止 |
| 5 | packages/ への切り出し | — | — |

各フェーズの終わりに、テスト（vitest・Playwright）を回してプルリクエストを出す。マージはあずまの OK で行う。

## 6. 未決事項

- **Q1**（決定：入れる）：管理画面の MD エディタで、文章をクリックして直接書き換える機能も移植する。
- **Q2**（決定：customAssets）：1記事だけの見た目調整は、customAssets の `customCss` に書き込む。
- **Q3**（決定）：1→2→3→4 の順。
