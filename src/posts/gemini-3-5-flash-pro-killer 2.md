---
title: Gemini 3.5 Flash登場。Flashが前世代Proを超えた日
slug: gemini-3-5-flash-pro-killer
description: 2026年5月19日、Google I/O 2026でGemini 3.5 Flashが発表されました。「Flash」なのに前世代のProを超える性能。価格・性能・モデル選びの常識がひっくり返った瞬間を、一次ソースと独立評価を交えて整理します。
date: 2026-05-23
author: 奥村 東
---

<link rel="stylesheet" href="../../_css/md/ini.md.css" />

<h1 class="text-gradient">Gemini 3.5 Flash登場。Flashが前世代Proを超えた日</h1>

【画像挿入】[Gemini 3.5 Flash 公式キービジュアル]

「Flashモデル」と聞くと、多くの人が「軽量・高速・安価な廉価版」を思い浮かべます。本格的な仕事はPro、雑用はFlash。長らくそれがAIモデル選びの常識でした 💡

ところが2026年5月19日、Google I/O 2026で発表された**Gemini 3.5 Flash**が、その常識を真っ向から破ってきました。

**前世代のGemini 3.1 Proを、Flashが超えた。**

これは「Flashがちょっと頑張った」というレベルの話ではありません。コーディング、エージェント、ツール使用といった「実際の仕事」の領域で、本来上位モデルであるはずのProを下回らないどころか、明確に上回っています ჱ̒⸝⸝•̀֊•́⸝⸝)

今回はこのGemini 3.5 Flashで何が変わったのか、価格・性能・モデル選びの常識がどう書き換わったのかを、一次ソースと独立評価を交えて整理します。

---

## 結論：Pro超えFlashが意味すること

時間がない人のために、結論を先に置いておきます。

- Gemini 3.5 FlashはGemini 3.1 Proをコーディング・エージェント領域で上回った
- 速度はフロンティアモデル比で**約4倍**（出力289トークン/秒）
- 価格は3.1 Proより**約40%安い**（input $1.50 / output $9.00 per 1M tokens）
- ただし純粋な推論力・長文脈検索ではProが優位という弱点もある
- 結果として「Flashで十分」な領域が一気に広がった

つまり、これまで「迷ったらPro」で済ませていた選び方が、用途次第で逆転する時代に入ったということです 👍

---

## 何が変わったか①：Flashが前世代Proを超えた

Googleの公式発表によると、Gemini 3.5 Flashは以下の主要ベンチマークでGemini 3.1 Proを超えています。

| ベンチマーク | 3.5 Flash | 3.1 Pro | 差分 |
|---|---|---|---|
| Terminal-Bench 2.1（コーディング） | **76.2%** | 70.3% | +5.9pt |
| MCP Atlas（ツール使用） | **83.6%** | 78.2% | +5.4pt |
| GDPval-AA（実務エージェント） | **1656 Elo** | 1314 Elo | +342 |
| Finance Agent v2 | **57.9%** | 43.0% | +14.9pt |
| CharXiv Reasoning（マルチモーダル） | **84.2%** | — | リード |

特に注目すべきは**MCP Atlas**のスコアです。前世代のGemini 3 Flashと比較すると**+21.6pt**という大幅な改善で、これはMCP（Model Context Protocol）経由でツールを呼び出すエージェントワークフローでの信頼性が劇的に上がったことを意味します。

僕自身もAntigravity上でGemini 3 Flashを使っていて、たまにツール呼び出しでつまずく場面がありました。3.5でそれが激減したと考えると、実務インパクトは数字以上に大きいです ✨

---

## 何が変わったか②：速度4倍、ハルシネーション31pt減

性能が上がっただけではありません。**速度**と**信頼性**の両方が前世代から大きく改善されています。

独立評価機関のArtificial Analysisによると：

- **Intelligence Index**: 55（3 Flashから+9pt、Claude Sonnet 4.6を上回る）
- **出力速度**: 289トークン/秒（フロンティアモデル比4倍）
- **ハルシネーション率**: 61%（3 Flashから-31pt）

「ハルシネーション率61%」だけ見ると高く感じますが、これはAA-Omniscienceという「あえて知らないことを聞く」評価で、知らないことを「知らない」と正しく答えられるかを測っています。31pt下がったというのは、デタラメを言わずに「分からない」と認める頻度が大きく上がったということ。

エージェント用途では、これが何より重要です。デタラメな関数名でツールを呼び出されたら、それだけでワークフローが破綻しますからね 笑

---

## 何が変わったか③：エージェント特化への明確な舵切り

今回のリリースで最も象徴的なのは、Googleが**「チャットボットからエージェントへ」**の路線を明言したことです。

同時に発表された**Gemini Spark**は、常時稼働してタスクを実行するAIエージェント。さらに**Google Antigravity 2.0**もスタンドアロンのデスクトップアプリとしてリリースされ、スケジュール実行や並列エージェント管理が可能になりました。

つまり、Gemini 3.5 Flashは単独で進化したのではなく、「**実行するAI**」のためのエコシステム全体の一部として設計されているわけです。

Googleはブログでこう書いています：

> 「3.5 Flashは、複雑で長期的なタスクで実世界の有用性を発揮するエージェントとコーディング向けに、フロンティア性能を提供します」

「会話して気の利いた答えをくれるAI」から、「タスクを引き受けて完遂するAI」へ。フェーズが完全に切り替わったというGoogleの宣言です 💡

---

## 何が変わったか④：API設計の刷新

開発者向けには、APIの仕様も変わっています。

**thinking_budget → thinking_level**

これまで整数値で指定していた思考予算が、`minimal / low / medium / high`の4段階の文字列指定に変わりました。デフォルトも`high`から`medium`に変更されています。

| 旧（〜3.1） | 新（3.5） |
|---|---|
| `thinking_budget: 8192`（数値で指定） | `thinking_level: "medium"`（4段階） |
| デフォルト high | デフォルト medium |

数値だと「いくつが適切か分からん」という問題がありましたが、4段階になったことでチューニングがシンプルになりました 👍

ちなみにモデルIDは`gemini-3.5-flash`。プレビュー版を経由せず**いきなりGA（一般提供）**でリリースされた点も異例です。Googleが「これは完成品だ」と自信を持っている証拠でしょう。

---

## 価格の話：値上げだが、Pro比では安い

ここまで良い話ばかりしてきましたが、**価格は前世代より上がっています**。

| モデル | input ($/1M) | output ($/1M) |
|---|---|---|
| Gemini 3 Flash Preview | $0.50 | $3.00 |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 |
| **Gemini 3.5 Flash** | **$1.50** | **$9.00** |
| Gemini 3.1 Pro | $2.00 | $12.00 |

3 Flash Previewと比べると**3倍**、3.1 Flash-Liteと比べると**6倍**。「Flashなのに値段が高くなった」と言われるのも分かります 笑

ただし、Gemini 3.1 Proと比べれば**約25〜40%安く**、しかも性能はProを超える領域がある。「割安な上位モデル」というポジショニングに変わったと考えれば納得できる価格設定です。

つまりFlashという名前は残っていますが、**役割としては「軽量モデル」ではなく「コスパ重視の主力モデル」**に再定義されたわけですね。

---

## 弱点もある：万能ではない

ここまで「Pro超え」を強調してきましたが、3.5 FlashにはProに劣る領域もちゃんとあります。

| ベンチマーク | 3.5 Flash | 3.1 Pro | 差分 |
|---|---|---|---|
| ARC-AGI-2（抽象推論） | 72.1% | 77.1% | -5.0pt |
| MRCR v2（128k長文脈検索） | 77.3% | 84.9% | -7.6pt |
| Humanity's Last Exam（純粋知識） | 劣る | 優位 | — |

つまり、**「ガチで難しい推論」「巨大な文書からのピンポイント検索」「専門知識の深掘り」**といった領域では、まだProの方が上です。

WaveSpeed Blogの分析が的を射ていて、「Flashは速度とコストを優先するために、深い推論と長文脈の精度を意図的に削った」と指摘しています。来月リリース予定の**Gemini 3.5 Pro**は、まさにこの弱点を埋めるためのモデルになるはずです。

「FlashでProを超える領域もあれば、Proでないと厳しい領域もある」。これが2026年のAIモデル選びのリアルな姿です ჱ̒⸝⸝•̀֊•́⸝⸝)

---

## 開発者の現場での意味

ここまでベンチマークの話をしてきましたが、Noe Shifticaの開発現場でどう影響するかも考えておきます。

僕は普段、Antigravity上でGemini 3 Flash / 3.1 Proを切り替えながら使っています。3.5 Flashが入ってきたことで、以下のような選び方になりそうです：

- **コード生成・修正・リファクタリング**: Flashで十分（むしろ速くて良い）
- **MCP経由のツール操作・複数ステップのエージェント実行**: Flashが最適解
- **長大なドキュメントの読み込み・難解な設計判断**: Proを使う
- **複雑な抽象思考・ARC-AGI的なパズル系**: Proを使う

これまで「とりあえずPro」で済ませていた部分の8〜9割は、Flashで十分捌けるようになった印象です。コスト的にも処理速度的にも、これは大きな変化です ✨

GitHub CopilotもGemini 3.5 Flashに即日対応していて、「near-Pro coding quality at Flash-tier speed and cost」と評しています。開発ツールベンダー側も「これはPro代替になる」と認識している証拠です。

---

## まとめ：モデル選びの常識が変わった

Gemini 3.5 Flashが示したのは、単なる性能アップではありません。

**「Flash＝軽量廉価版」「Pro＝本気のときの主力」というモデル階層の概念そのものが揺らぎ始めた**ということです。

世代を1つ跨ぐと、前世代の上位モデルを下位モデルが超える。これがLLMの進化スピードであり、僕らユーザーが意識すべき現実です。

「いつも同じモデルを使う」のではなく、「**そのタスクに最適なモデルは何か**」を都度考える。それがAI活用のリテラシーとして当たり前になっていくと思います 👍

来月リリース予定のGemini 3.5 Proも楽しみに待ちましょう‼️

---

## 参考ソース

### 一次ソース
- [Google公式ブログ: Gemini 3.5 frontier intelligence with action](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/)
- [Google DeepMind: Gemini 3.5 Flash](https://deepmind.google/models/gemini/flash/)
- [Google DeepMind: Model Card](https://deepmind.google/models/model-cards/gemini-3-5-flash/)
- [Google Cloud Blog: Innovations from Google I/O 26](https://cloud.google.com/blog/products/ai-machine-learning/innovations-from-google-io-26-on-google-cloud)
- [Google Developers: I/O 2026 highlights](https://blog.google/innovation-and-ai/technology/developers-tools/google-io-2026-developer-highlights/)
- [GitHub Changelog: Gemini 3.5 Flash GA for Copilot](https://github.blog/changelog/2026-05-19-gemini-3-5-flash-is-generally-available-for-github-copilot/)

### 独立評価・分析
- [Artificial Analysis: 独立ベンチマーク評価](https://artificialanalysis.ai/articles/gemini-3-5-flash-everything-you-need-to-know)
- [Simon Willison's Blog: 価格と仕様の分析](https://simonwillison.net/2026/May/19/gemini-35-flash/)
- [Appwrite: Deep dive benchmark review](https://appwrite.io/blog/post/gemini-3-5-flash-deep-dive)
- [LLM Stats: Complete specs](https://llm-stats.com/blog/research/gemini-3.5-flash-launch)
- [WaveSpeed Blog: Pro予告の含意分析](https://wavespeed.ai/blog/posts/gemini-3-5-pro-coming-next-month/)
- [Digital Applied: API変更点まとめ](https://www.digitalapplied.com/blog/gemini-3-5-flash-benchmarks-api-guide)

---

## 関連記事

【関連記事プレースホルダー】
- Noe Shifticaブログ内のAI・LLM・Antigravity関連記事のリンクをここに追加予定
- 候補：AIサブスク課金記事、Antigravityワークフロー記事、LLM進化系記事など
