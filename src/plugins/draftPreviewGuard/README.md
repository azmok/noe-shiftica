# draftPreviewGuard — 下書きプレビューの保護

`/dev/<slug>/preview` と `/blog/<slug>/preview` は、Payload（管理画面）にログインしているときだけ表示する。
未ログインは `/admin/login?redirect=<プレビューのパス>` へ送り、ログイン後に戻ってくる。

- iPad の Safari で管理画面にログインしておけば、noe-posts の Action が出すプレビュー URL をそのまま開ける。
- 管理画面の Live Preview（同一オリジンの iframe）はセッション Cookie が付くので、そのまま動く。
- 公開済みの記事ページ（`/dev/<slug>`, `/blog/<slug>`）には影響しない。
