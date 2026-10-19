# Antigravity 製品ファミリー整理

最終更新：2026-07-31
※料金・提供状況は変動が激しいため、実務判断の前に公式情報での再確認を推奨

---

## 結論：「Antigravity」だけでは製品を特定できない

<cite index="15-1">2.0以降、「Antigravity」は複数の入口を持つ統一基盤（ブランド）の名前として使われ、「Antigravity IDE」はその傘下にある特定の製品（旧1.0のデスクトップIDE）を指す呼び方になった。</cite>

つまり記事や手順書で「Antigravityを入れてください」と書くと、読者がどれをダウンロードすべきか判断できない。**必ず製品名を最後まで書く。**

---

## 4つの主要サーフェス

<cite index="12-1">Google Antigravity 2.0は、2026年5月19日のGoogle I/O 2026で発表されたエージェント中心の開発プラットフォームの新バージョン。スタンドアロンのDesktop App・Antigravity IDE・Antigravity CLI（Go製）・Antigravity SDK（Python）の4つの主要サーフェスに、Gemini APIのManaged AgentsとGemini Enterprise Agent Platformの関連経路を組み合わせる構成に再編された。</cite>

### ① Antigravity 2.0（スタンドアロン デスクトップアプリ）

- **位置づけ**：<cite index="7-1">デフォルトのおすすめ。複数のプロジェクトにわたり、タスクを同時に管理する</cite>
- **性格**：<cite index="9-1">AIエージェントを管理するためのアプリ</cite>
- **注意**：<cite index="15-1">バージョンの数字こそ「2.0」だが、旧IDEのメジャーアップデートではない。ここが最も誤解されやすい</cite>
- <cite index="14-1">2025年11月にGemini 3とともに公開された初代AntigravityはIDEを中心にエージェントを差し込む構成だったが、2.0ではIDEから独立したスタンドアロンのデスクトップアプリとして再設計された</cite>

### ② Antigravity IDE

- **位置づけ**：<cite index="7-1">エージェントを利用しながら直接コードを書きたい開発者向けのエディタ</cite>
- **中身**：<cite index="11-1">VSCodeベース</cite>。<cite index="9-1">エディタ、ターミナル、コード編集、AI補完といった従来のIDEに近い開発体験を提供する</cite>
- **選ぶ基準**：<cite index="7-1">エージェントが編集しているコードを正確に確認し、変更を1行ずつ承認または拒否したい場合に最適</cite>
- **利用可能モデル**：<cite index="10-1">Gemini（3.1 Pro / 3.5 Flash）だけでなく、Claude Sonnet/Opus、GPT-OSSも含まれる</cite>

### ③ Antigravity CLI

- **位置づけ**：<cite index="7-1">コマンドラインワークフローとヘッドレス実行用に設計されたターミナルインターフェース</cite>
- **実装**：<cite index="7-1">高速性を追求してGoで構築</cite>
- **選ぶ基準**：<cite index="7-1">ターミナルで高速なキーボード操作を好むユーザー向け。アクティブなコマンドラインウィンドウをロックせずバックグラウンドエージェントを起動できる。SSH経由やリモートコンテナ内などヘッドレス実行が必要な場合はこれ</cite>
- **Gemini CLIとの関係**：<cite index="14-1">既存のGemini CLIを完全に置き換える。Agent Skills、Hooks、Subagentsはそのまま維持され、ExtensionsはAntigravity pluginsに改名</cite>

### ④ Antigravity SDK

- **位置づけ**：<cite index="7-1">Antigravity Harnessを使用する独自のカスタムエージェントを構築・デプロイするためのPythonライブラリ</cite>
- **特徴**：<cite index="8-1">Googleのプロダクトを支えるものと同じエージェントハーネスを提供。Geminiモデルに最適化されており、カスタムエージェントの挙動を定義し、任意のインフラストラクチャ上でホストできる</cite>
- **用途例**：<cite index="9-1">社内コーディング規約に沿ってPRをレビューするエージェント、特定フレームワークに詳しい修正エージェント、テスト生成専用エージェント、ドキュメント更新専用エージェント、MCPや社内ツールと連携するエージェントなど</cite>

---

## その他の関連経路

| 名称 | 内容 |
|---|---|
| **Managed Agents** | <cite index="14-1">Gemini API経由で隔離Linux環境ごと呼び出せる</cite> |
| **Antigravity in Gemini Enterprise Agent Platform** | <cite index="14-1">Google Cloud接続を前提</cite>。<cite index="8-1">AntigravityとGoogle Cloudを直接接続し、エンタープライズのワークフローを簡素化</cite> |
| **Google AI Studio連携** | <cite index="8-1">プロジェクト全体をワンクリックでAntigravityのローカル開発環境および本番環境へと移行</cite> |

---

## 用途別・選択の早見表

| やりたいこと | 選ぶ製品 |
|---|---|
| 複数プロジェクトのタスクを横断管理したい | Antigravity 2.0（デスクトップアプリ） |
| コードを見ながら1行ずつ承認・却下したい | Antigravity IDE |
| ファイルツリーとエディタが必要（.env編集など） | Antigravity IDE |
| ターミナル操作が好き／SSH・リモート実行 | Antigravity CLI |
| 独自エージェントをPythonで作りたい | Antigravity SDK |

**記事で初心者に勧める場合** → Antigravity IDE
理由：ファイルツリー・エディタ・エージェントパネルが1画面に揃っているため、`.env` の編集など「ファイルを直接触る」手順を説明しやすい。

---

## Gemini CLI からの移行（重要な期限）

<cite index="14-1">Gemini CLIとGemini Code Assist IDE拡張は、AI Pro、AI Ultra、および個人向け無料利用者に対して2026年6月18日にリクエストの処理を停止した。Gemini Code Assist Standard / Enterpriseライセンスを持つ企業契約者は引き続き利用可能だが、コンシューマー利用者は移行が前提。</cite>

<cite index="10-1">つまり個人利用とエンタープライズ利用で扱いが異なる。現在Gemini CLIを使っている場合は、自分の利用形態がどちらに該当するのかを確認した上で移行を検討する必要がある。</cite>

⚠️ **記事執筆時の注意**：ネット上には `gemini` コマンドを前提とした古い手順が大量に残っている。読者が詰まる原因になるため、必ず注記する。

---

## 料金（2026年5月時点の情報）

<cite index="14-1">新AI Ultra（$100/月）を新設し、既存上位プランは$250から$200に値下げ。</cite>

<cite index="12-1">AI Ultra $100の新ティア新設とAI Ultraの$200上位ティアへの値下げなど、料金体系と機能の両面が同時に刷新されている。</cite>

<cite index="8-1">新しくなったGoogle AI Ultraプランで期間限定の特典として、100米ドル分のボーナスクレジットが提供される。Antigravityが利用制限に達しても、追加クレジットの分だけ利用を延長できる（有効期限2026年5月25日）。</cite>
→ この特典は期限切れ。

### 無料枠について（別途調査分）

- 提供開始時（2025年11月）：250リクエスト/日
- 2025年12月以降：**約20リクエスト/日**まで削減
- リフレッシュが週単位に変更され、上限到達で最大7日待たされる報告あり
- クォータは **デスクトップアプリ・CLI・SDK で共有**（別枠ではない）

⚠️ 料金・制限は変動が激しい。記事に書く際は必ず「◯年◯月時点」と明記し、公式確認を促すこと。

---

## 2.0で追加された主な機能

<cite index="12-1">2026年5月時点で、サブエージェントの並列実行、cron-likeなスケジュールタスク、Google AI Studio・Firebase・Android連携が追加されている。</cite>

---

## 記事執筆時のチェックリスト

- [ ] 「Antigravity」単体で書いていないか（必ず 2.0 / IDE / CLI / SDK を明記）
- [ ] Gemini CLI の廃止（2026年6月18日）に触れたか
- [ ] 料金・無料枠に「◯年◯月時点」の注記を入れたか
- [ ] 初心者向けなら Antigravity IDE を勧めているか
- [ ] クォータがアプリ・CLI・SDKで共有される点に触れたか
