# CLAUDE.md — Noe Shiftica (project rules for Claude Code / Kura-yan)

@AGENTS.md
@../ai-brains/common/rules.md
@ai-brains/common/rules.md

> The universal workflow (Startup Protocol / HARD STOP / Coder–Tester loop / Self-Check),
> the reporting rule and the shared rules live in ai-brains (`../ai-brains/common/workflow.md`,
> `common/reporting.md`, `common/rules.md`) so cloud and local agents read the same text.
> The global configs (`~/.claude/CLAUDE.md`, `~/.gemini/AGENTS.md`) only point to ai-brains.
> This file holds only Azuma's standing shortcuts for this project.
>
> **報告**：作業の区切りは HTML にして渡す。ai-brains の `tools/report/template.oui` をコピーして書き、`node scripts/ai-learning.mjs report <報告.oui>`（決まりは `common/reporting.md`。クラウドの Claude は Artifact で公開してリンクを渡す）。

> **Before starting any task, MUST recall the pre-task Signs** — they live as
> `type='sign'` events in `../ai-brains/projects/noe-shiftica/memory/memory.db` (readable mirror:
> `../ai-brains/projects/noe-shiftica/memory/mirror/signs.md`). Recall with
> `uv run ../ai-brains/projects/noe-shiftica/memory/db/query.py "<what you're about to do>" --type sign`.
> If you hit the **same error twice**, stop trial-and-error and re-read the Signs
> + the original instruction before retrying (original instruction + Signs win over the latest failure log).
> Memory layer contract: `../ai-brains/projects/noe-shiftica/memory/memory-schema.md`.
> （2026-11-26 に `.antigravity/` の中身は ai-brains の `projects/noe-shiftica/` へ移した。`.antigravity/` に残るのはバックアップ用の設定とパスワードだけ。）

> **AI の共通ルール・教訓・ミスの記録・引き継ぎは、非公開の `azmok/ai-brains` にある**（クラウドも手元の PC も `../ai-brains`。無いときだけ `sync` が `ai-brains/` にクローンする）。Claude Code では SessionStart フックが `node scripts/ai-learning.mjs sync` を実行し、教訓と引き継ぎ（`projects/noe-shiftica/handoff/tasks.md`）を表示する。続けて `decisions.md` と `log/` の最新月の末尾を読む。作業を終えるときは `log/` に追記し、`tasks.md` を直す（書き方は ai-brains の `common/handoff.md`）。詳しくは AGENTS.md の「AI 共通の脳」。設計の質問は、ai-brains の `projects/noe-shiftica/design-map/index.html` を見て、実物と照らしてから答える。

## Standing instructions (Azuma)
- **説明はかみ砕く**（あずまの指示 2026-11-25）：結論を最初に1〜2文。あずまがやることは番号付き（なければ「やることなし」）。専門用語は避け、使うならその場で言い換える。1文は短く、聞かれてない細部や長い表は出さない。質問は一度に1〜2個まで。ただし失敗・未確認・危険なことは省かない。
- バックグラウンドコマンド（App Hosting のロールアウト、長時間ビルド等）の**出力ファイルは確認しなくてよい**。完了通知 / exit code 0 だけで十分とみなす。
- 修正したら `git add` → **`git commit` → `git push` までクラやんの判断で実行してよい**（あずま承認済み 2026-11-24）。作業ブランチに push する。
- **プルリクエストの作成と main へのマージもクラやんの判断で行ってよい**（あずま承認済み 2026-11-25）。noe-posts の Action が出す md-assets 同期のプルリクエストも同じ。マージ前にテスト（tsc / vitest）が通っていることを確認する。
  - 例外：列を追加・変更するマイグレーションを含む変更は、先にマイグレーションの本実行（dry-run → あずまの承認 → 実行）を済ませてからマージする。
  - 保護ファイルの編集・マイグレーションの本実行・DB を壊しうる操作は、従来どおり事前にあずまの承認を取る。
- デプロイ後の本番反映確認・ロールアウトの追跡は待たなくてよい（Azuma が確認する）。
- **機能はプラグイン単位で作る**（詳細は `AGENTS.md` の Standing instructions）:
  1. 既存プラグイン（`src/plugins/*`）の守備範囲に入る変更は、そのプラグインを変更・追加する。
  2. どの既存プラグインにも属さない変更は、新規プラグインとして `src/plugins/<name>/` に作る。

## 記事の運用（noe-posts → Markdown そのまま表示）
- 記事の入り口は非公開リポジトリ `azmok/noe-posts`（`dev/<slug>/<slug>.md` → tech-posts、`blog/<slug>/<slug>.md` → posts）。**公開したら正本は DB**（公開済みの記事を Git から上書きできるのは、管理画面から書き出した `.md`（frontmatter に `baseRevision`）だけ）。
  iPad の Textastic + Working Copy で書き、作業ブランチへの push で下書き送信、main へのマージで `status: published` の記事を公開（noe-posts の Actions）。
- noe-posts の記事は `renderMode: 'markdown'` で保存され、表示は `src/plugins/markdownPostManager/`（markdown-it）。既存記事は `'lexical'` のまま変わらない。
- 記事ページの見た目は「サイト本物の CSS ＋ 上書き CSS（`article.css`。全セレクタに `#article-page` を付けて記事ページ全体に重ねる）」。手元の本番そっくりプレビューも同じ重ね方。**正本は noe-posts の `_assets/`**（CSS / JS / アイコン）。noe-posts の main で `_assets/` が変わると、Action が noe-shiftica の `public/md-assets/` を更新するプルリクエストを出す（`article.scoped.css` も再生成済み）。
- 下書きプレビュー（`/dev|blog/<slug>/preview`）は管理画面ログイン必須（`src/plugins/draftPreviewGuard/`）。
- 設計書：`docs/markdown-render-mode.md`（表示）／`docs/markdown-post-manager-and-style-editor.md`（プラグイン全体・上書きガード）

## クラウド環境での DB マイグレーション
Claude Code のクラウド環境は外向き通信が HTTPS（443）だけなので、Postgres の通常接続（5432）を使う
`pnpm db:migrate` は動かない。代わりに Neon の HTTPS ドライバで流す `pnpm db:migrate:https` を使う
（`scripts/migrate-over-https.ts`。結果は `payload migrate` と同じで、`payload_migrations` にも記録する）。
- 先に `pnpm db:migrate:https --dry-run` で流す SQL を確認してから実行する。`--status` で適用状況だけ見られる。
- 対応するのは `db.execute(sql\`...\`)` だけのマイグレーション（結果を読む / payload・req を使うものはエラーで止まる）。
- **列を追加するマイグレーションは、コードをマージ（本番ロールアウト）する前に流す**。逆順だと記事取得がエラーになる。

## ⚠️ ファイルエンコーディング（編集後に必ず検証）
Windows 環境＋複数エージェントで作業するため、ソースに **NUL バイト混入 / UTF-16 保存**の
“静かな文字化け事故”が起きうる（実例: `TagsField.tsx` が NUL 237個で `Bin` blob 化）。
- ソース編集後は **UTF-8・NUL 0** を確認: `file FILE` が `UTF-8 text`／`tr -d '\000' < FILE | wc -c == wc -c < FILE`。
- git diff で **text ファイルが `Bin …` や `0 insertions/0 deletions`** になってたら blob 破損を疑う。
- 直すときは部分パッチでなく**全文をクリーン UTF-8 で書き直す**。詳細は `../ai-brains/projects/noe-shiftica/rules/rules.md` 冒頭 IMPORTANT。

## Payload Admin カスタム Field の必読ナレッジ（実装前に必ず読む）
Payload v3 の `admin.components.Field` で UI フィールドを自作するときは、先に
下の2つの罠を読むこと（詳しくは ai-brains の `projects/noe-shiftica/memory/mirror/knowledge.md` の「Payload Admin カスタム Field の罠」と、`stacks/payload/lessons.md`）。
気づきにくい既知の罠が2つある：
- **罠1: `<input>` の Enter が React `onKeyDown` では効かない/ログも出ない** → 編集画面全体が `<form>` で
  Enter を先に横取りされるため。対策＝input の DOM に **capture フェーズ**でネイティブ keydown を張り、
  `preventDefault + stopPropagation + stopImmediatePropagation`。state は `latestRef` で最新参照（stale closure 回避）。
- **罠2: 複数フィールド共有の `type:'json'` への `setValue` が重く反映が数秒遅れる** → 表示を楽観的ローカル
  state で即描画し、重い `setValue` は `setTimeout(0)` で別tickへ。`setValue` は関数更新非対応（`valueRef` 経由）。

## Changelog 半自動運用（`changelog` コレクション）
サイトの `/changelog`（Payload `changelog` コレクション）は **Git 連携の半自動**で運用する。
完全自動で publish はしない（公開は必ず人間が確認）。

### 提案フロー（Claude Code 側から能動的に提案する）
作業の区切り（機能アップデートが一段落したタイミング）で、以下の条件に当てはまるなら
**「そろそろ changelog 作っておく？」と提案する**こと：
- 前回の changelog エントリ（最新の `date`）以降、コミットが概ね **5件以上**溜まっている、または
- `feat` / 機能追加系のコミットが含まれている。

判定材料の集め方（例）：
- 直近コミット：`git log --oneline -30`
- 前回 changelog 以降の差分：最新の published changelog の `date` 以降のコミットを対象にする。

### 草案生成ルール（承諾されたら実行）
未反映コミットのメッセージを読み取り、**粒度を2段階**に分けて草案化する：
1. **大きな機能アップデート** → 複数 `changes`、文章で説明（しっかり書く）。
2. **細かな修正** → 単語レベルに要約してちょろっと（例:「ヘッダー余白調整」「リンク色修正」）。

`category` は Keep a Changelog 準拠で**自動振り分け**する（目安）：
- `feat:` → **Added**
- `refactor:` / `style:` / `perf:` / `chore:`（挙動変化を伴うもの）→ **Changed**
- `fix:` → **Fixed**
- 削除・廃止（remove / drop / deprecate）→ **Removed**

タイミングは**まとめて**：細かい更新のたびに書かず、ある程度まとまった時点で1〜数エントリにまとめる。
同日の複数カテゴリは別エントリに分けてよい（タイムラインは `date` でグルーピング表示される）。

### 公開
草案は `status: draft` で提示し、内容を Azuma が確認・修正してから `status: published` にする。
Claude Code が勝手に published にはしない。
