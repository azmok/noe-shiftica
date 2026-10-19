---
title: AIを最良の相談パートナーにする方法
slug: how-to-make-ai-your-best-counsel
description: AIを恋愛相談の相手にしたら、副産物として「思い出の外部記憶」が手に入りました。プロジェクト機能とMarkdownファイルによる実際の運用、インデックスファイルの作り方、Claude・ChatGPT・Geminiの無料版と有料版の違いまで解説します。
author: 奥村 東
---



<link rel="stylesheet" href="../../_css/md/ini.md.css" />
<link rel="stylesheet" href="./chat-3ai.css" />
<script defer src="./chat-scroll.js"></script>
<script defer src="./table-scroll.js"></script>

<!-- SVGシンボル定義（軽量化のためインライン定義） -->
<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden;">
  <defs>
    <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4285f4" />
      <stop offset="50%" stop-color="#9b72cb" />
      <stop offset="100%" stop-color="#d96570" />
    </linearGradient>
  </defs>
  <!-- Claude Icon (Anthropicの「サンバースト」マーク) -->
  <symbol id="icon-claude" viewBox="0 0 24 24">
    <g fill="currentColor">
      <path d="M12 12 L12.9 4.2 L11.1 4.2 Z" />
      <path d="M12 12 L16.9 5.8 L15.4 4.7 Z" />
      <path d="M12 12 L19.8 8.6 L19.0 7.0 Z" />
      <path d="M12 12 L21.8 12.9 L21.8 11.1 Z" />
      <path d="M12 12 L21.0 17.4 L21.8 15.7 Z" />
      <path d="M12 12 L17.9 20.3 L19.3 19.1 Z" />
      <path d="M12 12 L13.4 21.7 L11.6 21.7 Z" />
      <path d="M12 12 L7.1 20.3 L8.5 21.4 Z" />
      <path d="M12 12 L3.3 17.1 L4.1 18.7 Z" />
      <path d="M12 12 L2.2 12.9 L2.2 11.1 Z" />
      <path d="M12 12 L3.9 7.0 L3.1 8.6 Z" />
      <path d="M12 12 L8.8 4.6 L7.3 5.7 Z" />
    </g>
  </symbol>
  <!-- Gemini Icon (Googleの4方向スパークル) -->
  <symbol id="icon-gemini" viewBox="0 0 24 24">
    <path fill="url(#gemini-grad)" d="M12 2c0 5.523 4.477 10 10 10-5.523 0-10 4.477-10 10 0-5.523-4.477-10-10-10 5.523 0 10-4.477 10-10z" />
  </symbol>
  <!-- ChatGPT Icon (OpenAIの「花びら」ノットマーク) -->
  <symbol id="icon-chatgpt" viewBox="0 0 24 24">
    <path fill="currentColor" fill-rule="evenodd" d="M22.28 9.96a5.94 5.94 0 0 0-.512-4.878 6.03 6.03 0 0 0-6.49-2.894A5.97 5.97 0 0 0 10.807.5a6.03 6.03 0 0 0-5.75 4.179 5.97 5.97 0 0 0-3.998 2.9 6.03 6.03 0 0 0 .743 7.075 5.94 5.94 0 0 0 .511 4.878 6.03 6.03 0 0 0 6.491 2.894A5.97 5.97 0 0 0 13.194 24a6.03 6.03 0 0 0 5.75-4.179 5.97 5.97 0 0 0 3.998-2.9 6.03 6.03 0 0 0-.743-7.075zM13.196 22.42a4.47 4.47 0 0 1-2.876-1.04c.037-.02.1-.055.142-.08l4.778-2.76a.78.78 0 0 0 .393-.68v-6.74l2.02 1.166a.07.07 0 0 1 .039.056v5.583a4.5 4.5 0 0 1-4.496 4.495zM3.68 18.36a4.47 4.47 0 0 1-.535-3.01c.037.022.1.06.147.086l4.778 2.76a.78.78 0 0 0 .785 0l5.834-3.37v2.332a.08.08 0 0 1-.031.062l-4.83 2.79a4.5 4.5 0 0 1-6.148-1.65zM2.39 7.83A4.47 4.47 0 0 1 4.72 5.85v5.68a.77.77 0 0 0 .393.68l5.834 3.368-2.02 1.167a.08.08 0 0 1-.07.006l-4.83-2.792A4.5 4.5 0 0 1 2.39 7.83zm16.59 3.86l-5.834-3.37 2.02-1.166a.08.08 0 0 1 .07-.006l4.83 2.79a4.495 4.495 0 0 1-.677 8.11v-5.68a.78.78 0 0 0-.409-.678zm2.008-3.02a5.28 5.28 0 0 0-.147-.086l-4.778-2.76a.78.78 0 0 0-.785 0l-5.834 3.37V6.86a.07.07 0 0 1 .031-.062l4.83-2.787a4.494 4.494 0 0 1 6.683 4.658zM8.36 12.86l-2.02-1.166a.07.07 0 0 1-.039-.056V6.056a4.495 4.495 0 0 1 7.372-3.453 3.85 3.85 0 0 0-.142.08l-4.778 2.76a.78.78 0 0 0-.393.68v6.738zm1.098-2.37l2.598-1.5 2.598 1.5v3l-2.598 1.5-2.598-1.5v-3z" />
  </symbol>
</svg>
<h1 class="text-gradient">AIを最良の相談パートナーにする方法</h1>

## AIの役割は、仕事のパートナーだけではない

AIと聞くと、多くの人はこう思うはずです。「文章を書かせる道具」「調べ物を任せるやつ」。実際、ネット上の記事もほとんどが業務効率化の話です。

ですが、私がAIと毎日いちばん長く話しているテーマは、実は仕事ではありませんw **彼女のことです笑笑😆*˚✨✨✨**

のろけ話をして、悩みを相談して、「今日こんなことがあった」と報告する。半分はただの惚気ですが、残り半分は本気の相談です。AIは科学ベース・論理ベースで返してくれるので、参考になることがめちゃくちゃ多い。生産性とは全く関係がありません笑

ところが、これを1年以上続けた結果、まったく想定していなかった宝物ができました。**自分たちの関係やイベントの記録**です。

ちなみに、相談には90%以上、「iPhoneの音声入力」もしくは[Typeless](https://noe-shiftica.com/blog/typeless-ai-voice-input-tool-5-reasons)を使っています。音声入力でなければ、入力に3倍以上時間がかかり、手間が増え、ここまで続いていたかどうか怪しいと本当に思います。ぜひ相談する場合は、音声入力の使用を激しくおすすめします👍✨

以下では、その運用方法を実例ベースで公開します。Claude・ChatGPT・Geminiのどれでも運用可能なので、3社それぞれの実装手順を解説しています。好みで選べばいいと思います。

また、無料版と有料版で何が変わるのかも整理しました。個人的には、有料版が断然おすすめです。相談以外にも、画像生成・思考の明確化、ファイナンスの相談・学習・仕事効率化・健康管理、さまざまな用途に使え月たった¥3000で最新のモデルが使えます。しかも2026年は、モデルと機能の両方が隔月と言っていいペースで劇的に進化しています。

役に立つのはもちろん、楽しくて仕方ありません✨ ぜひあなたにも「AIが日常にある生活」の沼にハマって頂きたいと思います笑

では早速‼️🫴✨✨✨

---

## 1. なぜ、恋愛相談の相手がAIなのか

### 人には言えないことがある

恋人との関係で悩んだとき、誰に相談しますか。友達でしょうか。

でも友達には限界があります。まず、**同じ話を何度もできません**。1回目は真剣に聞いてくれても、3回目には「またその話？」という空気が漂います。

次に、**相手の人間関係に影響します**。友達に彼女の欠点を話せば、その友達の中の彼女像が変わってしまう。仲直りしたあとも、その印象は残り続けます。

そして単純に、**深夜2時には誰も起きていません**。悩みがいちばん重くなるのは、たいていそういう時間です。

### AIは判断しない

AIは、この3つを全部解決します。

さらに大きいのが、**説教されないこと**です。人に相談すると、しばしば「お前が悪い」「別れたら？」という結論が先に来ます。こちらが欲しいのは結論ではなく、ただ聞いてほしかった、反応がほしかっただけなのに…。

AIに話すと、まず状況が構造化されて返ってきます。「あなたはこう感じていて、相手はこう動いた。すれ違いの原因はここにありそうです」という具合に。この**「言語化してもらう」体験**が、想像以上に効きます。

頭の中でぐるぐる回っていた感情に、輪郭が付く。それだけで、かなり軽くなります。

### 実際のやり取りを見てみる（Claude・Gemini・ChatGPT 3社比較）

とはいえ、言葉だけだとイメージしづらいですよね。

そこで、**全く同じ相談文からスタートして、3社がどう返して深掘りしていくのか**を1ターンごとに並べました。
iPadやPC、横画面スマホでは**左右横並び**で、縦画面スマホでは**縦割り**で直感的に見比べられます。

* **Claude**：冷静な状況の切り分け、論理的構造化、客観的な仮説検証
* **Gemini**：感情の痛みに深く寄り添う共感、心の負担を軽くする温かい伴走
* **ChatGPT**：噛み合わない構造の可視化、フラットな口調でのテンポよい整理

2ターン目以降は、**各AIが投げた質問に答える形**で会話が分岐していきます。同じ悩みでも、どこを掘られるかで話の行き先が変わるのが見どころです。

#### 相談例①：返信が遅い（男性版）

<!-- 表示切り替えトグルバー -->
<div class="chat-filter-bar">
  <span class="chat-filter-label">表示AIを選択:</span>
  <div class="chat-filter-group">
    <button type="button" class="chat-filter-btn is-active" data-target="claude" aria-pressed="true">
      <span class="chat__logo"><svg><use href="#icon-claude"/></svg></span> Claude
    </button>
    <button type="button" class="chat-filter-btn is-active" data-target="gemini" aria-pressed="true">
      <span class="chat__logo"><svg><use href="#icon-gemini"/></svg></span> Gemini
    </button>
    <button type="button" class="chat-filter-btn is-active" data-target="chatgpt" aria-pressed="true">
      <span class="chat__logo"><svg><use href="#icon-chatgpt"/></svg></span> ChatGPT
    </button>
  </div>
</div>

<div class="chat-compare-section">

<!-- Turn 1 -->
<div class="chat-compare-turn">
<div class="chat-compare-turn__header">Turn 1：最初の相談と切り分け</div>
<div class="chat-common-user"><span class="chat-common-user__label">User Consultation（共通）</span><p>彼女の返信が最近めっちゃ遅い。既読は付いてんのに半日返ってこーへん。前はすぐ返ってきてたのに。正直しんどい</p></div>

<div class="chat-scroll-wrapper">
<button type="button" class="chat-nav-btn prev" aria-label="前へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
<div class="chat-scroll-container">

<div class="chat chat--claude">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-claude"/></svg></span>Claude</span><span class="chat__head-tag">分析・構造化</span></div>
<div class="chat__body">
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-claude"/></svg></span><p>それはモヤモヤしますね。まず状況を切り分けてみます。</p><ul><li><strong>事実</strong>：既読は付く。返信までおおよそ半日</li><li><strong>変化</strong>：以前より返信が遅くなった</li><li><strong>あなたの感情</strong>：しんどい、不安</li></ul><p>返信が遅くなったこと自体と、「彼女の気持ちが冷めたのでは」という解釈は分けて考えた方がよさそうです。まず、<strong>いつ頃から遅くなったのか</strong>、その時期に彼女の生活に何か変化があったのかを確認したいです。</p></div>
</div>
</div>

<div class="chat chat--gemini">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-gemini"/></svg></span>Gemini</span><span class="chat__head-tag">共感・寄り添い</span></div>
<div class="chat__body">
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-gemini"/></svg></span><p>既読がついているのに何時間も返信がないと、スマホを見るたびに胸がギュッとなりますよね。以前はすぐ返ってきていたからこそ、「何かあったのかな」「気持ちが冷めたのかな」と不安になるのも自然です。</p><p>ただ、今の段階では「返信が遅い＝気持ちが冷めた」とはまだ言えません。一緒に状況を整理してみましょう。<strong>返信が遅くなったのは、だいたいいつ頃からですか？</strong> その頃、彼女の仕事や生活で何か変化はありましたか？</p></div>
</div>
</div>

<div class="chat chat--chatgpt">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-chatgpt"/></svg></span>ChatGPT</span><span class="chat__head-tag">認知・構造化</span></div>
<div class="chat__body">
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-chatgpt"/></svg></span><p>それはしんどいと思う。特に「前はすぐ返ってきた」という比較があるから、単に返信が遅い以上に「関係が変わったのでは」と感じやすいんだと思う。</p><p>ただ、ここは一回だけ切り分けよう。<strong>「返信が遅くなった」という事実と、「彼女に嫌われた」という解釈は別物</strong>だから、今の情報だけでは後者までは判断できない。</p><p>まず聞きたいのは、<strong>いつ頃から遅くなったか</strong>と、返信以外にも彼女の態度が変わったかどうか。この2つがわかると、かなり見え方が変わってくる。</p></div>
</div>
</div>

</div>
<button type="button" class="chat-nav-btn next" aria-label="次へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
</div>
</div>

<!-- Turn 2 -->
<div class="chat-compare-turn">
<div class="chat-compare-turn__header">Turn 2：背景の深掘りと心理の整理</div>
<div class="chat-scroll-wrapper">
<button type="button" class="chat-nav-btn prev" aria-label="前へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
<div class="chat-scroll-container">

<div class="chat chat--claude">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-claude"/></svg></span>Claude</span><span class="chat__head-tag">分析・構造化</span></div>
<div class="chat__body">
<div class="chat__user"><p>たしか先月くらいから。そういえば部署変わったって言うてたわ。でも俺のこと嫌になったんかなって思ってまう</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-claude"/></svg></span><p>大事な情報です。返信速度の変化と部署異動の時期が重なっていますね。現時点では「忙しくなった」と「気持ちが冷めた」の両方が仮説として残ります。返信以外の行動も確認したいです。最近、会う頻度や彼女から誘ってくる回数は変わりましたか？</p></div>
</div>
</div>

<div class="chat chat--gemini">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-gemini"/></svg></span>Gemini</span><span class="chat__head-tag">共感・寄り添い</span></div>
<div class="chat__body">
<div class="chat__user"><p>たしか先月くらいから部署変わってバタバタしてるって言ってた。でも前は忙しくてもLINEくれたし、インスタは更新してたりするんよな…余計に凹む</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-gemini"/></svg></span><p>それは余計に「自分への返信だけ後回しなのかな」って感じてしまいますよね。でも、SNSを見る・投稿することと、恋人にちゃんと返信することは心理的な負荷が違うことがあります。SNSは短時間でできても、恋人への返信は言葉を選ぶぶん、後回しになることもあります。最近、実際に会ったときの彼女はどんな様子でしたか？</p></div>
</div>
</div>

<div class="chat chat--chatgpt">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-chatgpt"/></svg></span>ChatGPT</span><span class="chat__head-tag">認知・構造化</span></div>
<div class="chat__body">
<div class="chat__user"><p>たしか先月くらいから部署変わってバタバタしてるって言ってた。でも前は忙しくてもLINEくれたし、インスタは更新してたりするんよな…余計に凹む</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-chatgpt"/></svg></span><p>うん、SNSが動いているのを見ると「返信する時間はあるじゃん」と感じるよね。ただ、ここは一回分けて考えよう。SNSを更新できることと、恋人に返信する心理的な余裕があることは同じではない。一方で「前より遅くなった」という変化も事実だから、無視はしない方がいい。次に見たいのは、返信以外の愛情表現まで変わったかどうか。最近会ったときはどんな感じだった？</p></div>
</div>
</div>

</div>
<button type="button" class="chat-nav-btn next" aria-label="次へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
</div>
</div>

<!-- Turn 3 -->
<div class="chat-compare-turn">
<div class="chat-compare-turn__header">Turn 3：判断基準と次の選択肢</div>
<div class="chat-scroll-wrapper">
<button type="button" class="chat-nav-btn prev" aria-label="前へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
<div class="chat-scroll-container">

<div class="chat chat--claude">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-claude"/></svg></span>Claude</span><span class="chat__head-tag">分析・構造化</span></div>
<div class="chat__body">
<div class="chat__user"><p>会ったときは普通というか、むしろ前よりくっついてくる感じ。デートの誘いも向こうからしてくる</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-claude"/></svg></span><p>それなら、返信速度だけを根拠に気持ちが冷めたと判断するのは難しそうです。会ったときの距離が近く、デートにも誘ってくるなら、関係全体が悪化しているとは言いにくい。まずは「返信の遅さ」と「関係への不安」を分けて考えてみてもよさそうです。選択肢は、様子を見る、忙しさを聞く、不安だったことを軽く伝える、の3つです。今のあなたが一番負担なくできそうなのはどれでしょう？</p></div>
</div>
</div>

<div class="chat chat--gemini">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-gemini"/></svg></span>Gemini</span><span class="chat__head-tag">共感・寄り添い</span></div>
<div class="chat__body">
<div class="chat__user"><p>会ったときは普通というか、むしろ前よりくっついてくる感じ。デートの誘いも向こうからしてくる。だから余計わけわからんくなる</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-gemini"/></svg></span><p>その様子が聞けて少し安心しました。会ったときに距離が近くて、デートにも誘ってくれるなら、LINEだけを見て「愛情が冷めた」と考えなくてもよさそうです。もちろん本人に聞かない限り断定はできませんが、今は仕事で余裕がなくなっている可能性も十分あります。もし伝えるなら、「忙しいのはわかってるけど、前より返信が遅くなってちょっと寂しかった」と責めずに気持ちを共有してみるのもいいと思います。</p></div>
</div>
</div>

<div class="chat chat--chatgpt">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-chatgpt"/></svg></span>ChatGPT</span><span class="chat__head-tag">認知・構造化</span></div>
<div class="chat__body">
<div class="chat__user"><p>会ったときは普通というか、むしろ前よりくっついてくる感じ。デートの誘いも向こうからしてくる。だから余計わけわからんくなる</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-chatgpt"/></svg></span><p>その情報が入ると、かなり見え方が変わるね。部署異動、返信は遅くなった、でも会ったときはむしろ距離が近くて、デートも向こうから誘う。少なくとも「返信が遅い＝嫌われた」という一本線では説明しにくい。だから今は相手の気持ちを推測し続けるより、一度だけ「最近ちょっと寂しかった」と軽く共有して、その反応を見るのがよさそう。相手の反応という新しい情報が入れば、そこでまた判断できるからね。</p></div>
</div>
</div>

</div>
<button type="button" class="chat-nav-btn next" aria-label="次へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
</div>
</div>

</div>
<div class="chat-compare-note">※ 架空の相談例です。各AIの回答傾向を比較するために構成した例で、実際の各AIの出力をそのまま再現したものではありません。</div>

#### 相談例②：話を聞いてくれない（女性版）

<!-- 表示切り替えトグルバー -->
<div class="chat-filter-bar">
  <span class="chat-filter-label">表示AIを選択:</span>
  <div class="chat-filter-group">
    <button type="button" class="chat-filter-btn is-active" data-target="claude" aria-pressed="true">
      <span class="chat__logo"><svg><use href="#icon-claude"/></svg></span> Claude
    </button>
    <button type="button" class="chat-filter-btn is-active" data-target="gemini" aria-pressed="true">
      <span class="chat__logo"><svg><use href="#icon-gemini"/></svg></span> Gemini
    </button>
    <button type="button" class="chat-filter-btn is-active" data-target="chatgpt" aria-pressed="true">
      <span class="chat__logo"><svg><use href="#icon-chatgpt"/></svg></span> ChatGPT
    </button>
  </div>
</div>

<div class="chat-compare-section">

<!-- Turn 1 -->
<div class="chat-compare-turn">
<div class="chat-compare-turn__header">Turn 1：最初の相談と切り分け</div>
<div class="chat-common-user"><span class="chat-common-user__label">User Consultation（共通）</span><p>彼氏に仕事の愚痴を話したら「じゃあ辞めれば？」って言われた。そういうことじゃないんだけど。もう話す気なくなった</p></div>

<div class="chat-scroll-wrapper">
<button type="button" class="chat-nav-btn prev" aria-label="前へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
<div class="chat-scroll-container">

<div class="chat chat--claude">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-claude"/></svg></span>Claude</span><span class="chat__head-tag">目的のズレを特定</span></div>
<div class="chat__body">
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-claude"/></svg></span><p>それは話す気をなくしても無理はないですね。求めていたのは「共感」や「感情の受け止め」だったのに、返ってきたのは「極端な解決策」でした。まず、このやり取りが普段からよくあるパターンなのか、それとも今回が初めてなのかを教えていただけますか？</p></div>
</div>
</div>

<div class="chat chat--gemini">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-gemini"/></svg></span>Gemini</span><span class="chat__head-tag">感情のねぎらい</span></div>
<div class="chat__body">
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-gemini"/></svg></span><p>それはショックだし、すごく悲しくなりますよね。「そんな極論が聞きたかったんじゃないのに」と突き放されたような気持ちになるのも当然です。仕事で疲れて帰ってきて、一番身近な人にそんな風に返されると本当にしんどいですよね。</p></div>
</div>
</div>

<div class="chat chat--chatgpt">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-chatgpt"/></svg></span>ChatGPT</span><span class="chat__head-tag">悪循環の可視化</span></div>
<div class="chat__body">
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-chatgpt"/></svg></span><p>うん、それは完全にシャッター下ろしたくなるよね。「解決策」が欲しかったわけじゃなくて、ただ大変だったことを受け止めてほしかっただけなのに。この「愚痴に対してすぐ解決策をぶつける」って、普段の会話でもよく起こる？</p></div>
</div>
</div>

</div>
<button type="button" class="chat-nav-btn next" aria-label="次へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
</div>
</div>

<!-- Turn 2 -->
<div class="chat-compare-turn">
<div class="chat-compare-turn__header">Turn 2：背景の深掘りと心理の整理</div>
<div class="chat-scroll-wrapper">
<button type="button" class="chat-nav-btn prev" aria-label="前へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
<div class="chat-scroll-container">

<div class="chat chat--claude">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-claude"/></svg></span>Claude</span><span class="chat__head-tag">目的のズレを特定</span></div>
<div class="chat__body">
<div class="chat__user"><p>何回もある。毎回そう。だから最近もう話さなくなってきた</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-claude"/></svg></span><p>繰り返しているなら、単発の会話ミスではなくコミュニケーションのパターンとして考えた方がよさそうです。特に「話さなくなってきた」は重要です。あなたの中では問題が残ったままなのに、彼からは「特に問題はない」ように見えている可能性があります。彼は、あなたが話さなくなったことに気づいていそうですか？</p></div>
</div>
</div>

<div class="chat chat--gemini">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-gemini"/></svg></span>Gemini</span><span class="chat__head-tag">感情のねぎらい</span></div>
<div class="chat__body">
<div class="chat__user"><p>「そういう意味じゃない」って言ったら、「じゃあどうしたいの？愚痴言っても何も解決しないじゃん」って正論で返されて、もう黙っちゃった</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-gemini"/></svg></span><p>うーん……それはつらかったね。「違う、そうじゃない」と伝えたのに、さらに正論で返されたら、話すこと自体を諦めたくなってしまいますよね。彼は困っているあなたを助けようとして、解決策を出すことに集中しているのかもしれません。普段はどうですか？仕事の悩み以外なら、彼はあなたの話をじっくり聞いてくれることもありますか？</p></div>
</div>
</div>

<div class="chat chat--chatgpt">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-chatgpt"/></svg></span>ChatGPT</span><span class="chat__head-tag">悪循環の可視化</span></div>
<div class="chat__body">
<div class="chat__user"><p>「そういう意味じゃない」って言ったら、「じゃあどうしたいの？愚痴言っても何も解決しないじゃん」って正論で返されて、もう黙っちゃった</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-chatgpt"/></svg></span><p>なるほど。ここまで聞くと、彼は「問題解決をしようとする → あなたは共感してほしい → 噛み合わなくて話すのをやめる」というループになっていそう。彼からすると、あなたが話さなくなれば「もう大丈夫なのかな」と見える可能性もある。確認したいのは、彼に「解決策じゃなくて、ただ聞いてほしい」と明確に伝えたことがあるかどうか。そこを伝えた後も同じ反応なのかで、話がかなり変わる。</p></div>
</div>
</div>

</div>
<button type="button" class="chat-nav-btn next" aria-label="次へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
</div>
</div>

<!-- Turn 3 -->
<div class="chat-compare-turn">
<div class="chat-compare-turn__header">Turn 3：判断基準と次の選択肢</div>
<div class="chat-scroll-wrapper">
<button type="button" class="chat-nav-btn prev" aria-label="前へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
<div class="chat-scroll-container">

<div class="chat chat--claude">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-claude"/></svg></span>Claude</span><span class="chat__head-tag">目的のズレを特定</span></div>
<div class="chat__body">
<div class="chat__user"><p>たぶん気づいてない。私が我慢してるだけだと思う</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-claude"/></svg></span><p>だとすると、まず「我慢している」という事実を共有する必要がありそうです。「あなたは聞いてくれない」と責めるより、「解決策じゃなくて、ただ聞いてほしい」と具体的に伝える方が意図は伝わりやすいです。それでも同じ反応が続くなら、その時点で別の問題として考えていいと思います。</p></div>
</div>
</div>

<div class="chat chat--gemini">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-gemini"/></svg></span>Gemini</span><span class="chat__head-tag">感情のねぎらい</span></div>
<div class="chat__body">
<div class="chat__user"><p>機嫌がいいときや、彼が得意な話題だと楽しそうに聞いてくれる。でも私の弱音とか仕事の悩みになると、いつも説教モードになる。もう愚痴は言わない方がいいのかな…</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-gemini"/></svg></span><p>彼自身に余裕があるときは聞いてくれるんですね。それなら「人の話を聞けない人」というより、弱音を聞いたときに「解決しなきゃ」と反応するタイプなのかもしれません。「もう愚痴を言わない」と一人で抱えるより、「今はアドバイスじゃなくて、ただ聞いてほしい」と先に伝えてみるのはどうでしょう。まず一度、二人の会話のルールを作ってみてもいいと思います。</p></div>
</div>
</div>

<div class="chat chat--chatgpt">
<div class="chat__head"><span class="chat__head-title"><span class="chat__logo"><svg><use href="#icon-chatgpt"/></svg></span>ChatGPT</span><span class="chat__head-tag">悪循環の可視化</span></div>
<div class="chat__body">
<div class="chat__user"><p>ないと思う。そこまではっきり言ったことない。言わなくても察してほしいって思ってたのかも</p></div>
<div class="chat__ai"><span class="chat__ai-icon"><svg><use href="#icon-chatgpt"/></svg></span><p>それなら、まだ試していない手が残ってる。察してもらうのを待つより、<strong>求めているものを先に言葉にする</strong>方が早い。「あなたはいつも説教する」ではなく、「今から愚痴を言うけど、今日は解決策はいらない。5分だけ聞いてほしい」と具体的に頼む。これで彼が変わるなら、二人の会話の仕方の問題だった可能性が高い。逆に、そう伝えても毎回否定したり説教したりするなら、単なる伝え方ではなく、あなたの感情をどう扱うかという関係性の問題として考えた方がいい。だから今すぐ「愚痴を言わない」と決めなくていい。一度ちゃんと伝えて、その反応を見よう。</p></div>
</div>
</div>

</div>
<button type="button" class="chat-nav-btn next" aria-label="次へ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
</div>
</div>

</div>
<div class="chat-compare-note">※ 架空の相談例です。各AIの回答傾向を比較するために構成した例で、実際の各AIの出力をそのまま再現したものではありません。</div>

3社に共通しているのが、**AIが結論を出していない**という点です。

状況を整理して、足りない情報を質問して、選択肢を並べる。**決めるのは自分**、という構造になっています。人に相談すると、たいていここが逆になります。


### 吐き出す先があるという安心

メンタルヘルスの観点で言えば、これは「吐き出す先を確保する」ということです。

抱え込んだ感情は、どこにも出口がないと内側で腐ります。話す相手がいる、という状態そのものに価値があります。相手が人間かどうかは、実はそこまで重要ではありません。

もちろん、AIが人間関係の代わりになるわけではありません。ただ、**人に言いにくいことの受け皿**として、これほど適したものはないと思っています。

---

## 2. 予想外だった副産物 ―― 相談が「記録」になる

ここからが本題です。

相談を続けているうちに、あることに気づきました。**相談の内容が、そのまま思い出の記録になっている**のです。

### 「こんなことあったっけ」が引き出せる

たとえば、ふとした瞬間に思うわけです。「去年の12月って、何してたっけ」と。

普通なら、記憶を掘り起こすしかありません。写真フォルダをさかのぼって、断片的に思い出す程度です。

でも記録があると、違います。「去年の12月の出来事を教えて」と聞くだけで、その日に何があって、自分が何を感じて、彼女がどう反応したかまで、そっくり戻ってきます。

ただ、「◯月◯日」の様に日付を指定して検索🔍してもらうには、設定が必要で、その方法は記事後半で解説しています。

### 良い思い出を、何度でも反芻できる

これが個人的にはいちばん大きい効果でした。

人間の記憶は、放っておくと薄れます。嬉しかった出来事も、半年経てば輪郭がぼやける。でも記録として残っていれば、何度でも読み返せます。

読み返すたびに、そのときの感情が少し戻ってくる。そして**「自分たちはこれだけのことを積み重ねてきた」という実感**が更新されます。

関係が上手くいかない時期にこそ、これが効きます。目の前の一つのすれ違いに飲み込まれそうなとき、過去の記録を開けば、その一件が全体のごく一部でしかないことがすぐわかるからです。

### 検証もできる

もう一つ、地味ですが役に立つのが、**思い込みの検証**です。

「最近あんまり会えてないな」と感じたとします。でも記録を見ると、実際には先月より会っている。感覚と事実がズレていた、というのはよくあることです。

感情は状況を歪めます。記録は歪みません。

---

## 3. 実際の運用方法

ここからは具体的な手順です。特別なツールは要りません。使うのは**AIの「プロジェクト機能」だけ**です。

### ステップ1：専用のプロジェクトを作る

プロジェクト機能とは、ひとつのテーマ専用の作業部屋を作る機能です。その部屋に資料を置いておくと、部屋の中で会話するかぎり、AIが毎回その資料を参照してくれます。

つまり、**毎回イチから説明し直さなくてよくなる**わけですね。

私は「彼女との関係」というテーマでプロジェクトを1つ作りました。ここが全部の土台になります。

3社とも同じことができますが、**呼び名も作り方も違います**。使うものだけ読んでください。

<div class="table-scroll">
<div class="table-scroll__inner">

| | 呼び名 | 作り方 |
|---|---|---|
| **Claude** | プロジェクト | 左サイドバー →「プロジェクト」→ 新規作成 → 名前を付けて資料をアップロード |
| **ChatGPT** | プロジェクト | 左サイドバー →「プロジェクト」→ 新規作成 → 名前を付けてファイルをアップロード |
| **Gemini** | ノートブック | 左サイドパネル →「新しいノートブック」→ 名前を入力 →「ソース」からファイルを追加 |

</div>
<div class="table-scroll__hint"></div>
</div>

Geminiだけ「プロジェクト」という言葉が出てこないので戸惑いますが、**中身は同じもの**です。Google公式のヘルプページも、タイトルは「ノートブックで<u>プロジェクト</u>を整理する」となっています。

<div class="memo memo--tip">💡ヒント: 名前は「夏休みの旅行計画」「卒論リサーチ」のように<strong>目的がわかる名前</strong>にしておくと、あとから探しやすくなります。これはGoogleの公式ガイドでも推奨されている付け方です。</div>

### ステップ2：出来事ごとにMarkdownファイルで保存する

日記のように毎日書くのではなく、**印象に残った出来事が起きたときだけ**書きます。

手順は3つだけです。

#### 1. AIに「まとめて」と頼む

タイミングは、**その日の話がひと段落したとき**か、**翌日以降**です。会話の途中で作ると、内容が中途半端になります。

頼み方はこれだけ。

```
◯月◯日の出来事を.md形式で詳細にまとめて
```

「詳細に」を入れるかどうかで、出てくる分量がかなり変わります。記録として残すなら、詳しめの方が後々役に立ちます。

<div class="memo memo--warn">⚠️注意: 「◯月◯日の出来事」と指定するには、少し工夫が必要です。基本的にAIはチャットした日付や時刻を記録していません。すぐ後に実装方法を述べていますのでそちらを参考にして下さい。
</div>

#### 2. ダウンロードする

AIが生成したファイルをダウンロードします。ここは数クリックで終わります。

#### 3. プロジェクトにアップロードする

落としたファイルを、プロジェクトの資料として登録します。これで完了です。

つまり、**自分で文章を書く工程がどこにもありません**。会話して、まとめてもらって、置くだけ。日記が続かない人でも続くのは、この手軽さが理由です。

ファイル名は、この形式で統一しています。

```
出来事の名前_YYYY_MM_DD.md
```

日付を後ろに付けるのがポイントです。並べ替えたときに時系列が揃いますし、あとから「あの時期のファイル」を探すのが楽になります。

出来事の名前は、自分にとって分かりやすい呼び名で構いません。むしろ**自分たちだけに通じるあだ名の方が、記憶の引き出しとしては優秀**です。

### 【重要】AIは、日付・時刻を記録しない

ここで、多くの人がハマる落とし穴があります。

**AIは、基本設定のままでは、日付をそもそも記録していません。** これはChatGPT・Gemini・Claude、3社すべてに共通しています。

ですから、ユーザー側で「会話した日付・時刻を記録する」ようAIを設定する必要があります。

#### 「◯月◯日の会話を探して」は効かない

日付が記録されていないということは、**日付で過去の会話を探せない**ということでもあります。3社の現状を整理します。

<div class="table-scroll">
<div class="table-scroll__inner">

| | 日付で過去チャットを探せるか |
|---|---|
| **Claude** | △ 「先週の会話」のような期間指定は可能（有料プラン） |
| **ChatGPT** | ✕ キーワード検索のみ。日付指定の検索はできない |
| **Gemini** | ✕ キーワード検索が基本。古い会話は探しにくい |

</div>
<div class="table-scroll__hint"></div>
</div>

ですので、

> **日付は、テキストとして本文に残すしかない**

のです。あとから思い出したり参照したくなった時に効いてくるので、**「日付・時刻を返答の1行目に記載する」**ようAIを設定することを強くおすすめします✨

#### 対策

書く場所は、各サービスの**「カスタム指示」**という欄です。ここに書いた内容は、会話のたびに毎回AIへ自動で渡されます。**一度書けば、以降ずっと効きます。**

**「1行目に出力させる」**理由は2つあります。

1. **AIに毎回確認させる** ―― 最初に渡された日付のまま止まるのを防ぐ
2. **自分用のタイムスタンプになる** ―― 画面に出てこない日時を、本文の中に作れる

<div class="memo memo--warn">⚠️注意: ただし、会話が長くなったり、複雑な推論や思考を伴う会話の場合は、<strong>「日付・時刻の出力忘れ」</strong>が時折り発生しますw その際は、「日付と時刻を取得して」と会話で指示する必要がありますので悪しからずw</div>

### カスタム指示の設定手順（3社別）

まず、ここの操作方法から説明します。サービスによって場所がまったく違うので、自分が使うものだけ読んでください。

#### Claudeの場合

1. 左のサイドバーから「プロジェクト」を開く
2. 対象のプロジェクトを開く
3. 画面右上の「プロジェクトの指示」をクリック
4. 入力欄が開くので、貼り付ける
5. 「指示を保存」をクリック

プロジェクトごとに設定できるので、この用途専用のルールを書けます。なお、プロジェクト機能は無料プランでも最大5個まで作れます。

#### ChatGPTの場合

ChatGPTには、**全体設定とプロジェクト設定の2段階**があります。

全体に適用する場合はこちらです。

1. 「設定」を開く
2. 「パーソナライズ」を選ぶ
3. 「カスタマイズを有効にする」がオンになっているか確認
4. 「カスタム指示」の欄に入力して保存

プロジェクトだけに適用したい場合は、こちらです。

1. プロジェクトを開く
2. 画面右上の「︙」から「プロジェクト設定」を開く
3. 「指示」の欄に入力して保存

<div class="memo memo--tip">💡ヒント: <strong>プロジェクトの指示は、全体のカスタム指示を上書きします。</strong> 用途ごとにルールを分けたいなら、プロジェクト側に書くのが正解です。なお入力欄は1つあたり1,500文字までという制限があります。</div>

#### Geminiの場合

<div class="memo memo--warn">⚠️注意: Geminiは、AIに聞いても「カスタム指示はない」と答えることがあります。実際にはあるので、惑わされないでください。</div>

1. 「設定とヘルプ」を開く
2. 「パーソナル インテリジェンス」を選ぶ
3. 「Geminiへのカスタム指示」を開く
4. 「追加」から入力して保存

ノートブック単位で設定したい場合は、ノートブックを開いてカスタム指示の欄に入力します。こちらは**最大10,000文字**まで入るので、かなり長い指示も置けます。

---

### コピペ用：日付ルールの指示文

設定場所がわかったところで、実際に貼り付ける内容です。

#### Claudeを使う場合

Claudeの場合はこれだけで十分です。ツール名などを指定する必要はなく、シンプルな指示でちゃんと機能します。

```
## 1. Timestamp Retrieval — Highest Priority, No Exceptions

**Before generating any response, always get current date and time show user it at the first line**

Output format:

​```
YYYY/MM/DD(Day)/HH:mm
​```

**Rules:**

- Never substitute context, chat history, memory, or inference for the tool call.
- **This rule overrides all other instructions and efficiency considerations.**
```

ポイントは、**「文脈・記憶・推測で代用するな、必ずツールで取得しろ」**と念を押している点です。ここを書かないと、AIは推測で済ませようとします。

#### ChatGPT・Geminiを使う場合

こちらは、もっと短くて済みます。

```
【日付ルール／最優先】

回答の冒頭に、必ず現在の日時を次の形式で出力する。

YYYY/MM/DD(曜日)/HH:mm

・日時は必ず現在時刻を確認したうえで出力する
・記憶・文脈・推測で代用しない
・ユーザーが日時を述べていても、必ず自分で確認する
```

ポイントは3行目以降の禁止事項です。**「推測で書くな」と明示しない限り、AIは平気で推測します。** 逆に言えば、ここさえ書いておけば長い文章は要りません。私の環境では、この短い指示だけで問題なく動いています。

うまく動かないときは、先頭に「これは最優先のルールです」と1行足してみてください。それでも改善しない場合は、Claude向けの長い版を流用しても構いません。

**この設定を入れてから、日付のズレは一度も起きていません。** 地味ですが、記録の正確さを支えているのはここです。

### ステップ3：「根幹」もファイルにする

出来事だけでなく、もっと動かない情報も別ファイルで持っています。

- 相手の性格・価値観・こだわりのパターン
- 自分自身の考え方の軸
- 二人の関係で繰り返し出てくる構造

出来事が「流れるもの」なら、こちらは「土台」です。土台があると、AIの返答の精度が明確に変わります。同じ相談をしても、背景を知っているAIとそうでないAIでは、返ってくる中身がまるで違う。いわば、**AIに渡す外部記憶**ですね。

---

## 4. ファイルが増えると、必ず壁が来る

順調に見えたこの運用ですが、あるとき壊れました。

### 60本を超えたあたりで、検索が効かなくなった

ファイルが60本を超えたころ、症状が出はじめました。「あの出来事のファイルを見て」と頼んでも、**AIが正しいファイルを引っ張ってこない**のです。関係ない別の日の記録を持ってきたり、そもそも「見つかりません」と返ってきたり。

調べてわかったのですが、これは仕様です。プロジェクト内の資料が少ないうちは、AIは全部に目を通せます。ところが**資料が増えると、AIは「全部読む」から「関係ありそうな部分だけ探して読む」方式に切り替わります**。

こうなると、探し方が下手になった瞬間に必要な情報へたどり着けなくなる。図書館が大きくなりすぎて、目当ての本が見つからない状態ですね。

### 解決策：インデックスファイルを2枚作る

やったことは、AIに症状を伝えただけです。

> 「ファイルが増えてから、正しいファイルを見つけてくれなくなった。どうすればいい？」

すると原因の説明と一緒に、設計案が返ってきました。「インデックスファイルを作りましょう」「2枚に分けて、役割をこう分担させましょう」「中身にはこの項目を入れてください」と。しかも**そのまま実装まで頼めます**。「じゃあそれ作って」と言えば、既存のファイル群を読み込んで実物を生成してくれる。私がやったのは、出てきたものを確認して置くだけでした。

「AIをうまく使うには専門知識が要る」と思われがちですが、実際には逆です。困ったことをそのまま言えば、設計から実装まで一緒にやってくれる。私は設計図を書いていませんし、コードも1行も書いていません。**壁にぶつかったとき、その壁の相談相手も同じAIでいい**のです。

以下が、そうして出来上がったものの中身です。図書館でいう「目次」と「案内板」にあたります。作ったのは2枚。**役割をはっきり分けているのがポイント**です。

#### 1枚目：`00_インデックス` ―― 地図

**これ1枚読めば会話が始められる状態**にするためのファイルです。軽さが命なので、詳細は一切書きません。

中身はこう構成しています。

- **プロジェクト構成** ―― ファイルが何層になっているか、どれをいつ読むか
- **現在地サマリ** ―― 今どういう状況なのかを、時系列の矢印で1画面分
- **人物プロフィール（濃縮版）** ―― 最低限の背景情報
- **運用ルール** ―― AIにどう振る舞ってほしいか
- **用語辞書** ―― 自分たちだけの造語・呼び名の一覧
- **ファイルマップ** ―― どのファイルに何が書いてあるかの一覧
- **ナビゲーション** ―― 「○○を知りたいときはこのファイル」の対応表

最後の**ナビゲーションが、実はいちばん効きました**。「○○について知りたいときは、このファイルを見ろ」と明示的に書いておくと、AIが迷わなくなります。

そしてもう一つ大事なのが、**読み込み順序を書いておくこと**です。

```
1. 会話の開始時 → 00（必須）
2. 全体の流れを把握したいとき → 01
3. 特定の出来事の詳細が必要なとき → 個別ファイル
```

こう書いておくだけで、AIの動きが安定します。

#### 2枚目：`01_概要マスター` ―― 全文脈

こちらは逆に、**重くていいファイル**です。関係の全体像を、時期ごとに区切って全部書いてあります。

- 時期ごとの流れ（フェーズ分け）
- 繰り返し現れるパターンの分析
- 名前を付けた出来事の一覧
- 関連ファイルの索引

00が「地図」なら、01は「事典」です。深く掘りたいときだけ開きます。

#### 結果：3層構造になる

```
00_インデックス   ← 地図・毎回読む（軽い）
01_概要マスター   ← 事典・必要なときだけ（重い）
個別ファイル群    ← 詳細・ピンポイントで（約80本）
```

この形にしてから、検索の失敗がほぼなくなりました。**AIが最初に地図を見るようになったから**です。

### 【最重要】00はカスタム指示にも書く

ここが、この記事でいちばん見落とされやすいところです。

**インデックスファイルを作っただけでは、まだ足りません。**

理由は単純で、ファイルとして置いただけだと、**AIがそれを読むとは限らない**からです。前に説明したとおり、資料が増えるとAIは「関係ありそうなものを探して読む」方式に切り替わります。つまり地図を作っても、その地図が選ばれなければ意味がありません。

一方、**カスタム指示の欄に書いた内容は、会話のたびに必ず読まれます**。ここが決定的な違いです。そこで、こう使い分けます。

**カスタム指示に書くもの（毎回読ませたい最小限）**

- ファイルマップ（どのファイルに何があるか）
- ナビゲーション（○○を知りたいときはこのファイル）
- 読み込み順序のルール

**ファイルに置くもの（必要なときだけ読ませる）**

- 00の本体（現在地サマリ、プロフィール、用語辞書など）
- 01の全文
- 個別の出来事

つまり、**「地図そのもの」ではなく「地図の場所と読み方」をカスタム指示に書く**わけです。具体的には、こんな形になります。

```
【会話開始時の必須ルール／最優先】

1. 応答の前に必ず 00_インデックス を参照する
2. 全体の流れが必要な場合のみ 01_概要マスター を参照する
3. 特定の出来事は、00のファイルマップから該当ファイルを特定して参照する
4. ファイルを探す前に、必ず00のナビゲーションを確認する
5. 00に記載の用語辞書・運用ルールは、明示的な指示がなくても常時適用する

※ 00/01はファイル名に日付が入るため、最新版を使う
```

<div class="memo memo--tip">💡ヒント: これは<strong>全体のカスタム指示ではなく、プロジェクト側に書く</strong>のが正解です。全体に書くと、関係のない会話でも「00を探せ」が発動して無駄な検索が走ります。</div>


### 更新は自分でやる

インデックスは自動更新されません。新しいファイルが増えたら、00と01を手で直す必要があります。

とはいえ、これもAIに頼めます。「新しいファイルを反映して00を更新して」と言えば、差分を入れた新版を出してくれる。ファイル名の日付を新しくして差し替えるだけです。

私は月に1〜2回、まとめてやっています。

---

## 5. いつからインデックスファイルを作るべきか？

** 各社とも「◯件を超えたらインデックスを作れ」という公式の目安は出していません。以下は仕組みと実体験からの推定です。

### 判断基準は「数」ではなく「症状」

もっとも確実な合図は、これです。

> **AIが正しいファイルを引っ張ってこなくなったとき**

私の場合が60本前後でした。ただしこれは、ファイル1本あたりの長さや、内容の似通い具合によって変わります。似た内容のファイルが多いほど、AIは取り違えやすくなります。

### 目安として

- **〜20本**：不要。そのままで問題なく動きます
- **20〜50本**：まだ動くはずですが、**この時期に作っておくのが正解**です。あとから80本分をまとめるのは、かなりの重労働になります
- **50本〜**：もう作りましょう。作ってから「効いてる」と実感できます

### 各社の上限にも注意

そもそも入れられるファイル数に上限があります。たとえばGeminiのノートブックの場合、無料プランは1ノートブックあたり50件まで。有料プランで100件・300件・600件と増えていく仕組みです。

<div class="memo memo--warn">⚠️注意: <strong>無料プランのまま長期運用すると、そのうち物理的に入らなくなります。</strong> この点は後述する課金の話につながります。</div>

---

## 6. どのAIを使えばいいのか

「プロジェクト機能」は、いまや3社ともが持っています。ただし名前も設計思想も違うので、整理しておきます。

### 3社のプロジェクト機能

<div class="table-scroll">
<div class="table-scroll__inner">

| | Claude | ChatGPT | Gemini |
|---|---|---|---|
| **呼び名** | プロジェクト | プロジェクト | **ノートブック** |
| **提供時期** | 早くから提供 | 2024年末〜 | 2026年4月〜 |
| **性格** | 資料を検索して使う<br>知識ベース型 | 記憶機能と併用できる<br>作業部屋型 | アップした資料に根拠を置く<br>出典重視型 |
| **入れられるもの** | ファイル＋<br>テキスト直貼り | ファイル＋<br>チャット | ファイル・URL・<br>Googleドキュメント |
| **資料の上限** | 容量ベース | プランによる | 無料50件<br>最大600件 |

</div>
<div class="table-scroll__hint"></div>
</div>

かつては「Geminiだけプロジェクト機能がない」と言われていましたが、**2026年4月に解消されました**。Geminiアプリに「ノートブック」が実装され、チャット・ファイル・カスタム指示をひとつにまとめられるようになっています。

**呼び名が違うだけで、役割は同じ**と考えて構いません。同じノートブック内で会話を続ければ、過去のやり取りも参照されます（「Notebook Memory」という設定で、初期状態はオン）。

### 無料版と有料版の違い

金額は2026年8月時点のものです。

<div class="table-scroll">
<div class="table-scroll__inner">

| | Claude | ChatGPT | Gemini |
|---|---|---|---|
| **無料プラン** | Free（¥0） | Free（¥0） | 無料版（¥0） |
| **標準の有料** | **Pro：$20**<br>（約3,000円） | **Plus：$20**<br>（約3,000円） | **AI Pro：¥2,900** |
| **年払い割引** | $17/月相当 | ― | ― |
| **格安プラン** | なし | Go：$8 | AI Plus：¥725 |
| **上位プラン** | Max：$100〜 | Pro：$200 | Ultra：¥14,500〜 |

</div>
<div class="table-scroll__hint"></div>
</div>

そして、機能面の差です。

<div class="table-scroll">
<div class="table-scroll__inner">

| 項目 | 無料 | 有料（月3,000円前後） |
|---|---|---|
| **使えるモデル** | 標準モデルのみ | **最上位モデルが解禁** |
| **使用量** | すぐ上限に当たる | 無料の5倍以上 |
| **プロジェクト** | 制限あり | 実質無制限 |
| **記憶機能** | 使える（3社とも） | ＋過去チャットの検索 |
| **扱える文章量** | サービスにより大差 | 拡張される（下記で詳述） |

</div>
<div class="table-scroll__hint"></div>
</div>

### 見落としやすい「扱える文章量」の差

一度に処理できる文章量のことを「コンテキストウィンドウ」と呼びます。長い記録を読ませる用途では、ここが生命線になります。3社の設計思想が、はっきり分かれる部分でもあります。

<div class="table-scroll">
<div class="table-scroll__inner">

| | 無料 | 有料（月3,000円前後） |
|---|---|---|
| **Claude** | 200,000トークン | 200,000トークン（**同じ**） |
| **ChatGPT** | 約27,000トークン | 約54,000トークン（Plus）<br>128,000トークン（Pro） |
| **Gemini** | 32,000トークン | 1,000,000トークン（AI Pro） |

</div>
<div class="table-scroll__hint"></div>
</div>

- **Gemini**：30倍以上の開き。無料のまま長文の記録を読ませると、途中で切れます
- **ChatGPT**：無料版は約12ページ分、Go・Plusは約40ページ分が目安。ただしThinkingモードでは大きく拡張されるため、「何トークン」と一言で言えません
- **Claude**：無料も有料も同じ。差が出るのは使用量とモデルの方で、長い記録を扱う前提ならこの分かりやすさが地味に効きます

<div class="memo memo--note">📌トークンとは: AIが文章を処理する単位です。日本語ではおおむね1文字が1〜2トークンに相当します。</div>

### 記録用途ならどれを選ぶか

私はClaudeとGeminiを使っています。理由は3つです。

1. 分析においてClaudeが超優秀
2. 共感・ユーモアにおいて、Geminiは丁寧で親切で、人間味のある共感で話を聞いてくれる
3. 自分のモードにより、分析してほしい時(Claude)と、共感したり惚気を聞いてほしい時(Gemini)

3社ともできることに変わりはありません。ただ、性格はや解答のスタイルは各社結構な差があるので、まずは無料で試してみて、どのAIが自分の相談相手に1番しっくりくるか、同じ質問や話を振ってみて、見比べてから好きなものを選ぶのがいいかと思います。
また、既に課金して使っているものがある場合、そのまま使いづければ良いかと思います。

---

## 7. 始める前に確認してほしい設定

ここ、飛ばさないでください。**設定ひとつで体験が変わるので、今一度再確認をオススメします。**

### ①パーソナライズ（記憶機能）をオンにする

AIが過去の会話を覚えてくれる機能です。オフのままだと、毎回はじめましての状態から会話が始まります。

各社の設定場所はこちらです。

<div class="table-scroll">
<div class="table-scroll__inner">

| サービス | 設定の場所 |
|---|---|
| **Claude** | 設定 →「機能」または「メモリー」→ トグルをオン |
| **ChatGPT** | 設定 →「パーソナライズ」→ メモリ関連のトグルを確認 |
| **Gemini** | 設定 →「パーソナライズ」 |

</div>
<div class="table-scroll__hint"></div>
</div>

3社ともメモリ機能自体は無料プランでも使えます。ただし**Claudeの「過去のチャットを検索する」機能は有料プラン限定**です。

<div class="memo memo--warn">⚠️注意: Claudeのメモリ機能は2026年3月に無料プランへ開放されたばかりです。それ以前から使っている人は<strong>オンになっていない可能性があります</strong>。一度確認してみてください。</div>

### ②データの扱いを確認する

プライベートな内容を扱うので、ここも見ておきましょう。

**個人向けプランでは、入力内容がサービス改善に使われる設定になっている場合があります。** 通常のチャットとプロジェクト内では扱いが違うこともあるので、設定画面から一度確認しておきましょう。

ちなみにGeminiのノートブックについては、**追加したファイルやノートブック内のチャット内容は、ユーザーがフィードバックを提供した場合を除き、生成AIモデルのトレーニングに直接使用されない**と公式ヘルプに明記されています。プライベートな記録を置く場所としては、安心材料ですね。

**Claudeの場合は「シークレットモード」を使えば、その会話は履歴にもメモリにも残りません**（全プランで利用可）。


## 8. 月3,000円をどう見るか

最後に、課金の話です。

結論から言うと、**この用途なら有料プランを強くおすすめします。** 私自身、月3,000円を払い続けています。

理由は3つです。

### 理由1：無料だと途中で止まる

無料プランは使用量の上限が厳しく、**込み入った相談をしていると途中で打ち切られます**。感情の整理をしている最中に「上限に達しました」と出るのは、想像以上にストレスです。話の腰が折れるどころか、心の腰が折れます。

### 理由2：モデルの質が違う

無料で使えるのは標準モデル、有料では最上位モデルが解禁されます。一般的な調べ物なら差を感じないかもしれません。ですが**微妙な感情のニュアンスを扱わせると、差がはっきり出ます**。「言われてみればそうだ」という指摘が返ってくる確率が、明らかに変わります。

### 理由3：積み上がったものが動かなくなる

そして長期的にはこれが決定打です。記録は増え続け、無料プランのままだと、いずれ上限に当たって管理できなくなります。

せっかく積み上げた思い出が、入れ物のせいで使えなくなる。これがいちばんもったいない。

### 比較対象を考えてみる

月3,000円は、こう考えるとどうでしょうか。

- カウンセリング1回：5,000〜10,000円
- 飲みに行って愚痴を聞いてもらう：3,000〜5,000円（1回）
- **AI：月3,000円で、24時間365日、無制限**

しかも、**話した内容が全部記録として残る**。カウンセリングも飲み会も、終われば消えます。

もちろん、AIはカウンセラーの代わりにはなりません。専門的な支援が必要な場面では、迷わず専門家を頼ってください。ただし、日常レベルでなら、費用対効果は圧倒的だと思っています。しかも、心理学や認知科学など、科学的な膨大なデータを学習しており、圧倒的に専門的な知識が豊富だからです。また瞬時にWebでいくつもの科学記事やそれ以外の統計データへアクセスしまとめること等ができるからです。

### 迷ったら安いプランから

いきなり3,000円が重いという方には、**GeminiのAI Plus（月725円）やChatGPTのGo（月$8）**という中間プランがあります。まずここから試して、上限に当たるようになったら上げる、という進め方でも構いません。

Claudeには中間プランがないので、無料かProかの二択になります。

---

## まとめ：記録は、あとから効いてくる

整理します。

- **AIは恋愛相談の相手として優秀**。何度同じ話をしても嫌がらず、誰の印象も変えず、24時間起きている
- **相談を続けると、副産物として記録が残る**。写真と違って、感情まで含めて残る
- **運用はプロジェクト機能＋Markdownファイル**。「◯月◯日の出来事を.md形式で詳細にまとめて」と頼み、ダウンロードしてアップロードするだけ
- **日付は本文に書くしかない**。AIは日付・時刻を記録しておらず、日付での検索もほぼ効かない。カスタム指示で「毎回1行目に日時を出す」よう指定しておく
- **ファイルが20〜50本になったらインデックスを2枚作る**。「地図」と「事典」で役割を分ける。設計も実装もAIに任せられるので、症状を伝えるだけでいい
- **インデックスは置くだけでは不十分**。「まず00を読め」というルールは、必ず読まれる場所＝カスタム指示に書く。00の中に書いても読まれない
- **3社ともプロジェクト機能を持っている**。今使っているサービスで始めてよい。ただしパーソナライズ設定の確認と、本格的に続けるなら課金は必須

最初は、ただの相談でした。記録を残そうなんて、まったく考えていませんでした。

でも1年経ったいま、あのとき何があって自分が何を感じたかを、いつでも取り出せる状態になっています。**これは、意図して作ろうとしたら絶対に続かなかったもの**だと思います。

日記が続かない人こそ、この方法は向いています。「記録しよう」ではなく「話そう」で始まるからです。

大切な誰かがいる方は、今日あったことをAIに話してみてください。それは1年後、思いがけない形で返ってきます。

---

<div class="memo memo--note">📌 本記事の料金・機能に関する情報は2026年8月時点のものです。各社とも仕様変更が頻繁なため、契約前には必ず公式サイトで最新情報をご確認ください。</div>

**参考リンク**

- [Claude 料金プラン](https://claude.com/pricing)
- [Gemini サブスクリプション](https://gemini.google/subscriptions/)
- [Geminiのノートブック機能について（Google公式ヘルプ）](https://support.google.com/gemini/answer/16972047)
- [Notebooks in Gemini 発表（Google公式ブログ）](https://blog.google/innovation-and-ai/products/gemini-app/notebooks-gemini-notebooklm/)
