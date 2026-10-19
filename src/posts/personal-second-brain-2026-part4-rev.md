---
title: 個人のための2026年最適解——蓄積量で、やるべきことは変わる
slug: personal-second-brain-2026-part4
description: Vector検索やGraphは、個人が本当に必要とするものなのか。蓄積量に応じた3段階の判断基準と、SQLiteを中心にした現実的な構成、そして実際に動かせる実装プロンプトまで解説します。
date: 2026-07-28
author: 奥村 東
---
<link rel="stylesheet" href="../../_css/md/ini.md.css" />
<h1 class="text-gradient">個人のための2026年最適解——蓄積量で、やるべきことは変わる</h1>

<div class="tldr">

- 蓄積量によって、やるべきことは3段階に分かれる
- 数百ノートまでは、何もしなくていい。作り込むのは目的と手段の逆転
- 個人スケールならSQLite 1ファイルで完結する。大がかりなDBは不要
- Microsoft純正のGraphRAGは、個人には確実に過剰

</div>

シリーズもいよいよ答え合わせです。ここまでで、Obsidianの限界も、Vector・Graph・GraphRAGの仕組みも押さえました。

残る問いは1つです。**「で、自分は結局どうすればいいのか」**

結論を先に書きます。**多くの人は、まだ何もしなくていいです。**

そして、やるべきタイミングが来たときも、**最も高機能な選択肢が最も適切であることは、まずありません。** 順番に説明します。

## 判断基準は「蓄積量」だけです

技術の話に入る前に、いちばん実用的な判断表を置いておきます。

| 段階 | 蓄積量の目安 | やるべきこと |
|---|---|---|
| **第1段階** | 〜数百ノート | **何もしない。** 書くことに集中する |
| **第2段階** | 数百〜数千 | **Vector検索だけ**を追加する |
| **第3段階** | 数千以上 | Graphの追加を**検討**する |

多くの個人は、第1段階か第2段階のどこかにいます。第3段階まで行く人は、かなり限られます。

### 第1段階：何もしなくていい

これが最も重要な結論です。

前々回の記事で、Obsidianは「書くための道具としては優秀」と書きました。数百ノート程度なら、**キーワード検索とフォルダ分けで十分に足ります。** この段階で検索の仕組みを作り込むのは、目的と手段の逆転です。

参考になる事例があります。AI研究者のAndrej Karpathy氏は、自身の知識ベース（約100記事・40万語規模）について、**「凝った検索の仕組みが必要だと思っていたが、この規模なら不要だった」**という趣旨の報告を2026年に公開しています。AIに索引ファイルと要約を維持させるだけで足りている、という内容です。

**規模が小さいうちは、シンプルな構成が正解です。** ここで数万円の講座を買う理由は、どこにもありません。

### 第2段階：Vector検索だけを追加する

「あのノート、何と書いたか思い出せない」が頻発し始めたら、この段階です。

**追加するのはVector検索だけで十分です。** Graphはまだ要りません。

理由は、個人の使い方の大半が「あの話、どこかに書いたはず」という**意味での検索**だからです。「Aから3手先にある関係」を探す場面は、実際にはあまり訪れません。

### 第3段階：Graphの追加を検討する

数千ノートを超えて、かつ**「つながりを発見したい」**という明確な目的があるときだけ、Graphを足す価値が出ます。

「検討する」と書いたのは、この段階でも必須ではないからです。次に説明するコストの話が効いてきます。

## なぜ、段階を分ける必要があるのか

理由は2つあります。1つは精度、もう1つはコストです。

### 理由①：入りきることと、読まれることは別問題

前回までに触れた**Lost in the Middle**（中抜け）を、もう少し正確に説明します。

AIは渡された情報のうち、**最初と最後には強く反応しますが、真ん中に埋もれた情報を見落としやすい**という性質を持っています。これは注意の仕組みそのものに組み込まれた偏りで、2026年時点でも構造的には解消されていません（単純な事実検索に限れば、改善したという報告もあります）。

ここが誤解されやすいポイントです。

```
AIが一度に扱える量が増えた
　　≠
渡したもの全部を、均等に読んでくれる
```

つまり、**「全部読ませればいい」という発想そのものが成立しません。** 数千ノートが仮に収まったとしても、真ん中は見落とされます。

だからこそ、**質問に関係するものだけを事前に絞り込んで渡す**必要がある。これがVector検索を入れる本当の理由です。量が増えるほど、絞り込みの価値が上がります。

### 理由②：Microsoft純正のGraphRAGは、個人には確実に過剰

前回、GraphRAGはMicrosoft Researchが2024年に発表した手法だと紹介しました。ただし、そのまま導入するのは個人にはまったく勧められません。**コストが桁違いだからです。**

初期の実装では、大規模なデータセットの処理に3.3万ドルかかったという報告があります。32,000語程度の書籍1冊でも、約7ドル。個人の蓄積が数千ノートあれば、無視できない金額になります。

前回説明した通り、費用の主犯は**AIを呼び出す工程**です。そして純正GraphRAGは、その高コストな工程を全部、事前に一括で実行する設計になっています。

さらに個人にとって相性が悪いのが、**継続的に文書が増えていく**という点です。純正版はデータ全体を作り直す前提なので、毎日ノートが増える使い方だと、更新のたびに重い再構築が発生しやすくなります。

Microsoft自身もこの問題を認識していて、2025年には**LazyGraphRAG**（重い処理を、質問が来るまで先送りする手法）を発表しています。外部からも**LightRAG**（追加分だけを処理できる手法）が登場し、コストを大幅に圧縮しています。

**「純正GraphRAGは重すぎる」というのが、すでに共通認識**になっているということです。

個人が採るべきは、**「保存したときに、そのノートだけを処理する」**という追加分だけの方式です。これなら費用は使った分だけで済みます。

## 技術選定——SQLite 1ファイルで完結する

第2段階以降に進む場合、何を使うか。個人スケールなら答えは単純です。

```
SQLite（データベース本体）
  ＋ sqlite-vec（意味検索の拡張機能）
  ＝ 単一ファイルで完結
```

大がかりなデータベースサーバーは要りません。**ファイル1つで動きます。**

しかも、これはPart2で書いた話と綺麗につながります。SQLiteのファイル形式は米国議会図書館の長期保存推奨形式で、2050年までのサポートが宣言されています。**Markdownと同等の永続性を持ったまま、検索の仕組みだけを手に入れられる**わけです。

### 全体の構成

```
【保存層】 SQLite + sqlite-vec
          ノートの原文と、意味の座標を1ファイルに格納

【処理層】 ノートを保存したとき、そのノートだけを処理
          → 意味の座標を計算
          → 既存ノートとの関係候補を算出
          → つながりとして追記

【検索層】 意味検索 ＋ キーワード検索を組み合わせる
          （第3段階なら、ここに関係の探索を足す）
```

**ポイントは、原文をデータベースの中に持つこと**です。こうしておけば、AIモデルが世代交代して座標が古くなっても、原文から作り直せます。壊れやすい部分を使い捨てにできる設計です。

## 実装の落とし穴——先に知っておくべき3つ

自分で作る場合、必ずぶつかる課題があります。知らずに始めると確実に手戻りします。

### ① つながりの判定基準

意味の近さでつながりを自動生成するとき、基準の設定が要ります。**緩すぎれば全部がつながって読めなくなり、厳しすぎれば孤立したノートだらけになります。**

堅実なのは二段構えです。まず意味の近さで候補を出し、次にAIに関係の内容を判定させて絞り込む。この2段階にすると、精度が安定します。

### ② 表記のゆれ

「田中太郎」「田中さん」「タナカ」が、別々のものとして登録されてしまう問題です。

個人のノートでは、同じ人や同じプロジェクトを気分で呼び分けていることが普通にあります。**同一のものとしてまとめる処理を、最初から設計に入れてください。**

### ③ 表示位置の連続性

つながりを図で表示する場合の注意点です。

絞り込みをかけるたびに配置が作り直されると、**「あのかたまりは左上にあった」という空間的な記憶がリセットされます。** 図で見る利点そのものが消えてしまうんです。

位置は保存しておき、絞り込み時は差分だけを動かす設計にしてください。

## 今日から動かせる実装プロンプト

最後に、AIコーディングエージェント（Claude CodeやAntigravityなど）に渡すだけで、試作品の構築が始まるプロンプトを置いておきます。上の落とし穴3つへの対策も、あらかじめ組み込んであります。

```
Build a local-first personal knowledge base prototype.

## Stack
- Backend: Node.js + SQLite (better-sqlite3) with the sqlite-vec extension
  — single file, no database server
- Frontend: React + React Flow (graph canvas) + a Markdown editor pane
- Embeddings: pluggable provider interface — assume an embed(text) -> float[]
  function; stub it so I can swap in a local model or an API

## Data model
- notes(id INTEGER PRIMARY KEY, title TEXT, body TEXT, created_at, updated_at)
- embeddings(note_id, vector) — one per note, always regenerable from body
- edges(from_id, to_id, weight REAL, label TEXT,
        source TEXT CHECK(source IN ('auto','manual')))
- entities(id, canonical_name, aliases TEXT[]) — for name normalization
- node_positions(note_id, x REAL, y REAL)
All relations use integer IDs. Titles are display-only, never keys.

## Core behaviors
1. Incremental indexing on save: re-embed ONLY the saved note, compute
   candidate edges against existing notes via cosine similarity
   (threshold as a config constant, default 0.78), then pass the top
   candidates to an LLM to assign a relationship label and prune
   false positives. Upsert with source='auto'. Never delete manual edges.
2. Entity normalization: before creating a node, check the entities table
   for an alias match. Merge instead of creating duplicates.
3. Search API: hybrid retrieval — vector similarity + keyword (FTS5),
   merged and re-ranked. Return only the top N chunks, never whole files.
4. Graph API: GET /graph?root={id}&hops={n}&from={date}&to={date}
   returns the filtered subgraph using a recursive query over edges.
5. Frontend layout: run force-directed layout ON FIRST RENDER ONLY.
   Persist positions to node_positions. On filter change, animate the
   enter/exit of nodes — never recompute positions of surviving nodes.
6. Include a "reindex all" command that regenerates every embedding and all
   auto edges from source text, proving the analysis layer is disposable.

## Constraints
- Single repo, npm scripts for dev/run
- Seed with 30 sample notes across 3 topics so the graph is demoable
- README documenting the similarity threshold and how to tune it

Confirm the schema with me before implementing the frontend.
```

第2段階までで十分な人は、`4`と`5`のグラフ関連を外してください。それだけで、意味検索だけのシンプルな構成になります。

## まだ埋まっていない空白

最後に、現状の限界も書いておきます。

**裏側の技術は、すでに成熟しています。** Vector検索もGraphも、部品としては手に入る状態です。

空白なのは、**人間が見て触る部分**です。全体像（マクロ）と個別のノート（ミクロ）を、滑らかに行き来できる画面。「この話題から2手先まで」と絞り込んだ瞬間に、その部分だけが再構築される表示。**これを備えた製品は、まだほとんど存在しません。**

裏側が揃った今、ここが最も面白い領域だと僕は思っています。上のプロンプトを起点に、自分好みの形を作れる時代になりました。

## まとめ

- 判断基準は蓄積量だけ。数百ノートまでは何もしなくていい
- 数百〜数千ならVector検索だけ。Graphは数千を超えてから検討
- 「全部読ませればいい」は成立しない（Lost in the Middle）
- 個人スケールならSQLite 1ファイルで完結する
- Microsoft純正のGraphRAGは個人には確実に過剰。追加分だけを処理する方式にする

ここまでが、**溜めたデータをどう活かすか**という話でした。

次回からは、もう1つのテーマに入ります。「AI社員」——**役割を持ったAIに仕事を任せる**仕組みです。こちらも、実は無料の標準機能だけで作れます ჱ̒⸝⸝•̀֊•́⸝⸝)

## 関連記事

<!-- TODO: noe-shiftica.com/blog の関連記事リンクをここに追記。Part1〜3・Part5〜6への相互リンクも追加すること -->
