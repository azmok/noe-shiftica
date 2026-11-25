# 引き継ぎメモ（次のセッション用）

> 最終更新：2026-11-25 18:30 JST。新しいセッションは、まずこのファイル → `CLAUDE.md` → `docs/markdown-post-manager-and-style-editor.md` の順に読む。
> 作業が進んだら、このファイルを更新してから終える。

## 0. 2026-11-25 夕方の作業（最新）

- あずまから「Markdown Post Manager いい感じ」の返事あり（本番で動いている）。下の §1 のデプロイ失敗は #34（フォントの自前ホスト）で解消済みの見込み
- noe-posts の整理（noe-posts PR #4、マージ済み）：本番に公開済みの記事（似た版・重複も）を削除。REA vs Craft は新しい版を `dev/rea-vs-craft-anything-where-humans-stand/` に寄せた（画像 01〜03.png は相変わらず GitHub に無い）
  - 未公開なので残したもの：`blog/_archived` の共同経営者2本・ベンチマーク・情報9割・転スラ、`dev/_fin/AI×Obsidian批判` の連載（日本語版以外）、`blog/best-ai-model-comparison-guide-2026-11` など
- Markdown Post Manager に追加：優先度フラグ（frontmatter `priority`）、GitHub で開くアイコン、📁 移動・削除（詳細は `manager/APP.md`）
- 追加（#36 / noe-posts #5）：一覧の優先度フィルタ・並べ替え切り替え／**公開したら noe-posts から自動削除**（publish.yml。API が公開済み＋markdownRevision を返したものだけ。GITHUB_TOKEN で push。初回の本番実行はまだ見ていない）
- changelog：v1.9.0 の草案を `status: draft` で DB に作成（id 80 Added・81 Fixed）。公開はあずまが確認してから
- 残り：フェーズ3の「Git に書き出す」、フェーズ4 styleEditor

## 1. （解決済みの見込み）本番デプロイが失敗していた

- **#29〜#32 をマージしたあと、Firebase App Hosting のデプロイ（ロールアウト）が失敗している**。本番は前の版のまま：
  - `/api/mpm/config` と `/mpm-app/index.html` が 404
  - #26/#27 の CSS 修正は本番に入っている。壊れたのは #29〜#32 のどれか
- **原因は未特定**。手元の `next build` では次の結果だった：
  - コンパイルと TypeScript の型チェックは通過
  - 静的ページを作る段階で DB（5432）に繋がらず、`/whats-new` の prerender で止まる。クラウド環境の外向き通信は 443 だけなので、これは環境のせい
  - そのため、本番の失敗箇所までは再現できていない
- 次にやること：
  1. ビルドログを読む。あずまに Firebase コンソールのロールアウトのビルドログを貼ってもらうか、あずまが追加したログ閲覧用の環境変数・鍵があればそれを使う（2026-11-25 にあずまが新しい環境変数を設定済み。中身は本人に確認）
  2. 原因を直し、プルリクエストを作ってマージする（マージはエージェントの判断で可。CLAUDE.md 参照）
- 疑わしい変更（新しい順）：
  - #32：管理画面のタブ（`src/plugins/markdownPostManager/manager/*`、`public/mpm-app/`、global `markdown-post-manager-settings`、admin view `/admin/markdown-post-manager`、`afterNavLinks`）
  - #30/#31：`markdownSource` のカスタム Field（`admin/MarkdownEditorField.tsx`）、collection beforeChange フック（`contentSync.ts`）
  - #29：`markdownRender` → `markdownPostManager` への改名、`markdownRevision`
- メモ：App Hosting の runtime は `nodejs20`。`PAYLOAD_SECRET` は RUNTIME のみ（BUILD では読めない。`manager/settings.ts` は呼ばれたときだけ読むので問題ないはず）。

## 2. リポジトリと流れ

| | 役割 |
|---|---|
| `azmok/noe-shiftica`（このリポジトリ） | サイト本体（Next.js 16 + Payload 3.79、Neon Postgres、Firebase App Hosting）。作業ブランチ `claude/practical-lovelace-q5nhq2` |
| `azmok/noe-posts`（非公開） | 記事の入り口。`dev/<slug>/<slug>.md` → tech-posts、`blog/<slug>/<slug>.md` → posts。下書きは `draft/<フォルダ名>` ブランチ |

- 記事の流れ：noe-posts の下書きブランチに push → `draft.yml` が `/api/ai/posts` に下書き送信（`draft/<folder>` ではそのフォルダだけ送る）→ main にマージ → `publish.yml` が `status: published` の記事を公開。
- **公開したら DB が正本**。公開済み記事を Git から上書きできるのは、frontmatter の `baseRevision` が DB の `markdownRevision` と一致する .md だけ（それ以外は 409 `db-is-newer`）。
- 見た目の正本は noe-posts の `_assets/`。main で変わると `assets-to-site.yml` が noe-shiftica に md-assets 同期のプルリクエストを出す（マージはエージェントの判断で可）。

## 3. 設計書のフェーズと進み具合（`docs/markdown-post-manager-and-style-editor.md`）

| # | 内容 | 状況 |
|---|---|---|
| 1 | markdownPostManager の土台・版の印・上書きガード | ✅ マージ済み（#29）。DB マイグレーション batch 20 適用済み |
| 2 | 管理画面の MD エディタ＋本物ページのプレビュー＋クリック編集（公開後の記事用） | ✅ マージ済み（#30, #31）。**本番では未確認** |
| §2.7 | 管理画面のタブ「Markdown Post Manager」（Netlify エディタの引っ越し。公開前の記事用） | ✅ マージ済み（#32）。DB マイグレーション batch 21 適用済み。**本番では未確認** |
| 3 | 公開したら noe-posts から自動で削除＋「Git に書き出す」ボタン | ⬜ 未着手 |
| 4 | styleEditor（本物のページ上で見た目を調整。DB に保存） | ⬜ 未着手 |
| 5 | `packages/` への切り出し | ⬜ 未着手 |

決まっていること（Q1〜Q3 とタブ版）：
- クリック編集は入れる
- 1記事だけの CSS は customAssets の `customCss` に書く
- フェーズは 1→2→3→4 の順
- タブ版の GitHub の鍵は管理画面の設定に入れる（暗号化して保存）
- タブ版にスタイルモードは入れない
- Netlify は動作を確認できたら止める

## 4. デプロイが直ったら、あずまがやること

1. noe-posts 用の Fine-grained token を作る（権限は Contents: Read and write と Actions: Read-only）。
2. 管理画面 →「Markdown Post Manager 設定」に、URL（`https://github.com/azmok/noe-posts.git`）と鍵を入れる。
3. 左メニューの「📝 Markdown Post Manager」で動作を確認する。
4. Netlify の `noe-post-viewer`（site id `4c4fe769-719a-43cb-9f6b-9d2496c26fa9`）をあずまが削除する。

## 5. 残っている細かいこと

- changelog：今日の機能追加ぶんの草案を提案済み。返事待ち（草案は `status: draft` で作り、公開はあずまが行う）。
- noe-posts で画像が GitHub に無い記事：
  - artcraft（`01_adobe_to_craft_map.png`）
  - rea-vs-craft（`01_inner_outer_loop.png`）
  - who-and-how-is-Azuma-Okumura（`01_life_timeline.png`、`02_bookshelf_layers.png`）
  - best-ai-model-comparison-guide-2026-11（`01_release_timeline_oct_nov.png`）
- noe-posts の `_tools/`：Pythonista での手元用に残している旧エディタ。今後の正本は `public/mpm-app/`（説明は `src/plugins/markdownPostManager/manager/APP.md`）。
- あずまへの注意喚起：iPad で作業する前に、Working Copy で Pull する（古いファイルで上書きされる事故が2回あった）。

## 6. 環境メモ

- DB マイグレーションは `pnpm db:migrate:https`（`--dry-run` で確認 → あずまの承認 → 実行）。列やテーブルを追加するものは、コードをマージする前に流す。実行前に Neon にバックアップ用ブランチを作る。
  - Neon project `proud-hall-53361784`
  - 今日作ったバックアップ用ブランチ：`backup/pre-markdown-revision-20261125`、`backup/pre-mpm-settings-20261125`
- Netlify は `[skip ci]` 付きのコミットをデプロイしない（noe-posts の `_tools/` を変えるときは付けない）。
- 管理画面そのものは、クラウド環境では DB に繋がらないため起動できない。UI は部品単体を esbuild でバンドルして Playwright で確認してきた（テストスクリプトはセッションの scratchpad にあったので消えている。必要なら作り直す）。
- 返答のルール（あずまの個人設定）：
  - 1行目に `TZ=Asia/Tokyo date '+%Y/%m/%d(%a)/%H:%M'` の結果を出す
  - 関西寄りのタメ口で、「あずま」と呼ぶ
  - 分からないことは「不明」と書く
  - 曖昧なときは実行前に質問する
