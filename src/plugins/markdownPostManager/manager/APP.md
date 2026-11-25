# mpm-app — Markdown Post Manager のエディタ本体

管理画面のタブ（`/admin/markdown-post-manager`、`src/plugins/markdownPostManager/manager/ManagerView.tsx`）が iframe で開く静的アプリ。
もとは noe-posts の `_tools/`（Netlify で公開していたエディタ）。2026-11-25 にこちらへ引っ越し、以後の正本はここ。

- 記事一覧（左のドロワー）・本番そっくりのプレビュー・クリック編集・MD 表示（スクロール連動）・保存の結果（理由つき）
- GitHub との通信は `/api/mpm/github?path=…`（`manager/endpoints.ts`）。管理画面のセッションで呼び、鍵はサーバーが付ける。
  中継するのは設定したリポジトリ（`/repos/<owner>/<repo>…`）だけ
- リポジトリの URL と鍵は、管理画面の「Markdown Post Manager 設定」（global `markdown-post-manager-settings`）。鍵は暗号化して保存し、API では返さない
- 見た目の調整（スタイルモード）は出さない（`store.allowStyle = false`）。styleEditor（設計書フェーズ4）で行う
- `store.js` は local（noe-posts の preview_server.py）/ github（鍵をブラウザに持つ旧 Netlify 方式）/ payload（このタブ）の3通りで動く
