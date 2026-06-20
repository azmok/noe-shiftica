# CLAUDE.md — Noe Shiftica (project rules for Claude Code / Kura-yan)

> Agent identity and the universal workflow (Startup Protocol / HARD STOP /
> Coder–Tester loop / Self-Check) live in global config (`~/.claude/CLAUDE.md`,
> `~/.gemini/AGENTS.md`) and project `AGENTS.md`. This file holds only Azuma's
> standing shortcuts that override those defaults.

> **Before starting any task, MUST read `.antigravity/GUARDRAILS.md`** (pre-task Signs).
> If you hit the **same error twice**, stop trial-and-error and re-read GUARDRAILS.md
> + the original instruction before retrying (original instruction + GUARDRAILS win over the latest failure log).

## Standing instructions (Azuma)
- バックグラウンドコマンド（App Hosting のロールアウト、長時間ビルド等）の**出力ファイルは確認しなくてよい**。完了通知 / exit code 0 だけで十分とみなす。
- 修正したら**毎回 `git add` まで**を作業の区切りとする（ステージングまで実行する）。
- **`git commit` と `git push` は、Azuma が明示的に指示するまで絶対に実行しない。** 「完了した」「検証OK」等は実行の許可を意味しない。
- デプロイ後の本番反映確認・ロールアウトの追跡は待たなくてよい（Azuma が確認する）。

## ⚠️ ファイルエンコーディング（編集後に必ず検証）
Windows 環境＋複数エージェントで作業するため、ソースに **NUL バイト混入 / UTF-16 保存**の
“静かな文字化け事故”が起きうる（実例: `TagsField.tsx` が NUL 237個で `Bin` blob 化）。
- ソース編集後は **UTF-8・NUL 0** を確認: `file FILE` が `UTF-8 text`／`tr -d '\000' < FILE | wc -c == wc -c < FILE`。
- git diff で **text ファイルが `Bin …` や `0 insertions/0 deletions`** になってたら blob 破損を疑う。
- 直すときは部分パッチでなく**全文をクリーン UTF-8 で書き直す**。詳細は `.antigravity/rules.md` 冒頭 IMPORTANT。

## Payload Admin カスタム Field の必読ナレッジ（実装前に必ず読む）
Payload v3 の `admin.components.Field` で UI フィールドを自作するときは、先に
`.antigravity/knowledge/backend/admin-ui/custom-field-keyboard-and-shared-json.md` を読むこと。
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
