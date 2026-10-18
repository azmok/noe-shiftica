# AI API Plugin

AI（外部AI連携の API キー）から記事を投稿・公開・削除するための API と、その呼び出しログをまとめたプラグイン。

## 登録するもの
- **`POST /api/ai/posts`**（`endpoints/posts.ts`）: 記事フォルダの `.md` と画像（base64）から記事を作成・更新する。`{ slug, collection, status: "published" }` だけ送ると最新の下書きをそのまま公開する。
- **`DELETE /api/ai/posts?id=` / `?slug=`**: 記事を削除する。
- **`api-logs` コレクション**（`collection.ts`）: 上記の呼び出し結果を記録する。一覧の上部に API ガイド（`components/ApiEndpointGuide.tsx`）を出す。

## 仕組み
- Payload のルートエンドポイント（`config.endpoints`, path `/ai/posts`）として動く。Next.js の独自ルートではないので、Markdown → Lexical 変換（`markdownImport` の `parseMarkdownToLexical`）を直接呼べる。
- 認証は `x-api-key` / `Authorization: Bearer` / `Authorization: api-clients API-Key` のどれでも可。権限は `api-clients` プラグインの権限マトリクス（`canAccess`）に従い、保存は呼び出し元として `overrideAccess: false` で行う。
- 前処理（`<link>` / `<h1>` / HTML コメント / X の `widgets.js` の除去）、画像のプレースホルダー差し替え、リンクの新しいタブ化は `markdown.ts`。

## 登録順
`api-logs` も `apiClientsPlugin()` の権限ラップの対象にするため、`payload.config.ts` の `plugins` では `apiClientsPlugin()` より前に置く。

## クライアント
`scripts/publish-article.mjs`（記事フォルダを送る薄いクライアント）。
