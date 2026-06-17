# html-hosting プラグイン（HTMLホスティング）

CSS / JavaScript を含む HTML を **そのまま 1枚のページとしてホスティング** するための Payload プラグイン。

## 機能

- 管理画面に「**HTMLホスティング**」コレクション（`hosted-pages`）を追加。`New` から新規作成。
- 編集 UI は **HTML / CSS / JS の3分割 Monaco エディタ**（`components/HostingEditor.tsx`）。
  - 「**HTMLファイルをアップロード**」ボタンで 1枚の HTML を取り込み、`lib/parseHtml.ts` が
    `<style>` → CSS、インライン `<script>` → JS、本体 → HTML に分解して各エディタへ流し込む。
    外部リソース（`<link rel="stylesheet">` / `<script src>`）は HTML 側に温存する。
  - 直接3つのエディタへ入力することも可能。
  - 「プレビュー」で `sandbox` 付き iframe による組み立て結果を確認できる。
- **スラッグ（URL）** をユーザーが任意設定。英小文字・数字・ハイフンに正規化＋一意制約。
- 公開 URL `/p/<slug>` を発行し、**コピーボタン**でクリップボードへコピー（`components/HostingUrlField.tsx`）。

## 配信

`src/app/p/[slug]/route.ts`（Route Handler）が `/p/<slug>` で配信する。
`lib/assemble.ts` の `assembleHtmlDocument()` が HTML/CSS/JS を 1枚の完全な HTML ドキュメントへ結合する：

- HTML セクションが完全文書（`<html>` を含む）の場合 → `<head>` に `<style>`、`</body>` 直前に `<script>` をインジェクト。
- body 断片の場合 → 標準テンプレート（`<!DOCTYPE html>` ＋ `<head>`（CSS）＋ `<body>`（HTML＋JS））で包む。

Route Handler はレイアウトの影響を受けないため、サイトのヘッダー/フッターを含まない
スタンドアロンな HTML として配信される。

## 登録

`src/payload.config.ts` の `plugins` 配列に `htmlHostingPlugin()` を追加済み。

## データモデル

| フィールド | 型 | 用途 |
| --- | --- | --- |
| `title` | text | 管理用ページ名（公開ページの `<title>`） |
| `slug` | text (unique) | 公開 URL（`/p/<slug>`） |
| `html` | textarea | 本体 HTML（3分割エディタの Field コンポーネント） |
| `css` | textarea (hidden) | CSS |
| `js` | textarea (hidden) | JavaScript |
| `hostingUrl` | ui | 公開 URL 表示＋コピーボタン（保存対象外） |

## 注意

- 新規コレクション追加に伴い Postgres には `hosted_pages` テーブルが必要。
  本番反映時は通常のマイグレーションフロー（`pnpm db:create-migration` → `pnpm db:migrate`）に従うこと。
- 配信されるページは投稿者（認証済み管理者）が作成した任意の JS を同一オリジンで実行する。
  信頼できる作成者のみが編集権限を持つ前提で運用すること。
