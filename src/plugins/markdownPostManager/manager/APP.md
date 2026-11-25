# mpm-app — Markdown Post Manager のエディタ本体

管理画面のタブ（`/admin/markdown-post-manager`、`src/plugins/markdownPostManager/manager/ManagerView.tsx`）が iframe で開く静的アプリ。
もとは noe-posts の `_tools/`（Netlify で公開していたエディタ）。2026-11-25 にこちらへ引っ越し、以後の正本はここ。

- 記事一覧（左のドロワー）・本番そっくりのプレビュー・クリック編集・MD 表示（スクロール連動）・保存の結果（理由つき）
- ツールバーの記事操作（2026-11-25 追加）：
  - 優先度：frontmatter の `priority: high | medium | low`。ほかに未保存の変更が無ければ即 commit。一覧は優先度順＋色の点（前回の結果はこの端末に記憶）
  - GitHub アイコン：その記事を GitHub で開く（下書きブランチがあればそちら）。リンクはクリップボードにもコピー（AI に渡す用）
  - 📁：移動・削除。`dev/<slug>/<slug>.md` はフォルダごと（画像も）、それ以外は .md だけ。main と下書きブランチの両方に git trees API で1 commit ずつ。
    1枚の .md を dev/・blog/ 直下へ移すと `<slug>/<slug>.md` の形にする。下書きブランチ名が変わるなら付け替え、削除ではブランチも消す
  - 🚀 公開：PR なしで、記事フォルダを `status: published` にして main に直接 commit → noe-posts の `publish.yml` が公開する。
    未保存・画像不足・GitHub 上の内容と不一致・main 側でも変更あり、のときは止まる。最後に確認が1回出る。下書きブランチは消さない
  - 一覧のドロワー：優先度で絞り込み（すべて／高だけ／高・中／優先度あり／なし）と、優先度順・名前順の切り替え（この端末に記憶）
  - 中継（`/api/mpm/github`）は ref の更新と削除のため PATCH・DELETE も通す
- GitHub との通信は `/api/mpm/github?path=…`（`manager/endpoints.ts`）。管理画面のセッションで呼び、鍵はサーバーが付ける。
  中継するのは設定したリポジトリ（`/repos/<owner>/<repo>…`）だけ
- リポジトリの URL と鍵は、管理画面の「Markdown Post Manager 設定」（global `markdown-post-manager-settings`）。鍵は暗号化して保存し、API では返さない
- 見た目の調整（スタイルモード）は出さない（`store.allowStyle = false`）。styleEditor（設計書フェーズ4）で行う
- `store.js` は local（noe-posts の preview_server.py）/ github（鍵をブラウザに持つ旧 Netlify 方式）/ payload（このタブ）の3通りで動く
