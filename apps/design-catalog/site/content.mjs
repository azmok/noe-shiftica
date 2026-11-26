// noe-shiftica.com の公開中の文章（2026-11-26 時点の src/app/(frontend) と /blog から）。創作した実績や数字は入れない。
const media = 'https://firebasestorage.googleapis.com/v0/b/noe-shiftica.firebasestorage.app/o/';
export const live = 'https://noe-shiftica.com';

export const nav = [['top', 'Home'], ['services', 'Services'], ['works', 'Works'], ['about', 'About'], ['blog', 'Blog']];

export const posts = [
  ['fully-remote-not-cutting-corners', '会わないことは、手抜きではありません——制作会社が「移動」を削ぎ落とした理由', '制作', 'fully-remote-not-cutting-corners.png'],
  ['failed-sage-never-gave-up', '君の常識で、君の可能性を測るな。——『落第賢者の学院無双』が教えてくれた、本当の強さ', '思考', 'failed-sage-never-gave-up-800x450.webp'],
  ['best-ai-model-comparison-guide-2026-10', '【2026.10最新】主要AIモデル比較 ── 6月から何が変わった？あなたにBestなモデルはこれ！', 'AI', 'ai-benchmark-guide-article-202610-800x370.png'],
  ['asset-type-thinking-skill-assets-life-boost', '人生をブチ上げる「資産型思考」', '思考', 'IMG_0142-800x436.png'],
  ['this-shitty-wonderful-world', 'このろくでもない、素晴らしき世界〜アニメに学ぶ、これからの生き方〜', '思考', 'IMG_0138-800x446.png'],
  ['quit-cram-school-for-ai-tutor', '今すぐ塾を辞めてAI(有料版)を家庭教師にすべき理由', 'AI', 'quit-cram-school-for-ai-tutor-2-800x446.png'],
  ['google-vs-ai-best-research-method-2026', 'ググる vs AIに聞く？ 2026年の「最強の調べ方」はコレ！', 'AI', 'google-vs-ai-2026-research-method-1-800x446.png'],
  ['freelance-web-production-total-cost-comparison', 'フリーランスに頼むと 結局いくらかかる？', '制作', 'freelance-web-production-total-cost-comparison-800x600.png'],
  ['motivation-dopamine-want-to-scotoma', 'なぜあなたはやる気が出ないのか？', '思考', 'motivation-dopamine-want-to-scotoma-3-800x600.png'],
  ['typeless-ai-voice-input-tool-5-reasons', '【神アプリ】【音声入力】「Typeless」で作業時間が1/3に', 'AI', 'lets-try-typelss-2-800x600.png'],
  ['wordpress-outdated-latest-web-production-trends', '「とりあえずWordPressで」はもう古い？最新のWeb制作事情', '制作', 'is-wp-outdated-and-up-to-date-stack.modified-800x600.png'],
  ['how-long-will-you-continue-typing-on-the-keyboard', 'いつまでキーボード入力を続けますか？', 'AI', 'how-long-will-you-continue-typing-on-the-keyboard-2-800x600.png'],
].map(([slug, title, group, image]) => ({ slug, title, group, image: `${media}${image}?alt=media` }));

export const pillars = [
  ['AIで速く、人間で美しく', 'コーディングの反復作業はAIが担い、デザインの感性と判断は人間が担う。速さと品質を同時に実現する構造です。'],
  ['本質から設計する', '見た目を整えるのではなく、ブランドの核心から再設計します。Noesis（本質を掴む知性）× Shift（変化の設計）— それがNoe Shifticaの思想です。'],
  ['最新技術で、育つサイトを', 'Next.js / Payload CMS / Neonによる構成で、公開後も成長できるサイトを作ります。テンプレートでは作れない、拡張性と速度を両立した設計です。'],
];

export const steps = [
  ['Hearing', 'ヒアリングシートへの記入と、15〜30分のDiscovery Call（任意）。目的・ターゲット・参考サイトを確認し、迷いどころを最初に潰します。'],
  ['Design', '方向性を1本に絞り、Awwwards水準のデザインに仕上げます。テンプレートは使いません。'],
  ['Build', 'Next.js × Payload CMS × Postgresで実装。表示速度・SEO・運用性をすべて両立した構成で構築します。'],
  ['QA Check', 'Claude.aiによる自動品質チェック。セキュリティ・バグ・抜け漏れをAIが二重確認します。'],
  ['Launch', '公開。その後も月5,000〜10,000円の保守プランで継続サポートします。'],
];

export const plans = [
  ['Lite', '¥150,000〜', 'LP・ポートフォリオ。スピード重視パッケージ', '納期：約1〜2週間'],
  ['Standard', '¥350,000〜', 'コーポレートサイト。CMS（ブログ等）導入', '納期：約3〜4週間'],
  ['Premium', '要相談', '多機能・システム連携。AI運用自動化フルパック', '納期：要相談'],
];

export const faq = [
  ['対応エリアはどこですか？出張や訪問は可能ですか？', 'Noe Shifticaはフルリモート専門のスタジオです。東京・渋谷にオフィスを構えていますが、打ち合わせはすべてオンライン（Zoom / Google Meet）で完結します。ご訪問・出張対応は行っていませんが、オンラインで全国どこからでもご相談いただけます。'],
  ['AIの導入支援も相談できますか？', 'はい、お任せください。Web制作はもちろん、GeminiやClaudeなどの生成AIを業務に取り入れるご支援も行っています。「AIって何から始めればいいの？」という段階からでも、一緒に考えます。'],
  ['Next.js / Reactって、普通のサイトと何が違うの？', '一言で言うと「表示が速くて、壊れにくい」サイトが作れます。速さはそのままSEOの評価にも直結するので、検索で見つけてもらいやすくなります。将来的な機能追加にも強い構成でお届けします。'],
  ['納品後に自分でコンテンツを更新できますか？', 'はい、管理画面から簡単に更新できる仕組みを標準で導入しています。ブログ記事の追加や文章の修正なら、専門知識ゼロでOKです。月額保守プランでは、セキュリティ更新や細かな修正もまとめてお任せいただけます。'],
];

export const works = [
  ['MIRAI FOUNDRY', 'Web Design / Static', 'Digital Artifacts Foundry — Tokyo/Berlin', './media/mirai-foundry-thumb.png', 'https://demo-static-mirai-foundry.pages.dev/'],
  ['DESIGNER PORTFOLIO.', 'Web Design / Portfolio', 'Creative Designer Portfolio — Experiential Design', './media/portfolio-thumb.png', 'https://designer-portfolio-566328988333.us-west1.run.app/'],
];

export const services = [
  ['Web Design & Build', 'LP・ポートフォリオ・コーポレートサイト。テンプレートなし、ブランドから設計。', ''],
  ['CMS & Content Operations', '公開後も自分で更新できる設計。PayloadCMS でブログ・実績・採用など拡張可能。運用マニュアル付き。', `${live}/services/cms-content-operations`],
  ['AI Workflow Integration', '業務フローへのAI組み込み。自動化設計・ツール選定。Premiumプランの中心サービス。要相談ベース。', `${live}/services/scenarios`],
];

export const flow = [
  ['お問い合わせ・無料相談', 'まずはメールまたはフォームからご連絡ください。ご要望・ご予算・スケジュールをヒアリングします。費用は一切かかりません。'],
  ['お見積もり・ご契約', '内容を整理した上で、税込の明確なお見積もりを提示します。納得いただいた上でご契約へ。着手金（総額の50%）をお支払いいただきます。'],
  ['制作開始', '着手金のご入金を確認後、制作をスタートします。進捗はこまめに共有し、フィードバックを反映しながら進めます。'],
  ['納品・残金お支払い', '完成データをご確認いただき、問題なければ納品完了。残金（総額の50%）をお支払いいただきます。'],
];

export const about = [
  ['Noe Shifticaとは何か', ['「Noe」はギリシャ語のNoesis（ノエシス）に由来します。直観的知性、つまり表層ではなく本質を掴む認識力のことです。', '「Shiftica」はShift（変化・転換）とラテン語的語尾の-ica（体系・美学）を組み合わせた造語です。変化を設計する体系、美しく転換させる知的構造を意味します。']],
  ['なぜ作るのか', ['「稼ぎたい」と「楽しく生きたい」は、本来矛盾しない。しかし多くのビジネスで、ブランドの見せ方がその両立を妨げています。予算がなくてテンプレートを使う。クオリティを上げようとすると高額になる。どちらを選んでも、WantToを諦めることになる。', 'Noe ShifticaはAIと最新技術を使って、その構造を壊します。目指しているのは、「自分の思うように生きたい」という意志を持つ人が、世界と正面から向き合えるブランドを手に入れること。デザインはそのための道具です。']],
  ['どうやって作るのか', ['Noe Shifticaは、1人のスタジオです。AIツール（Claude.ai、Midjourney等）を制作ワークフローに統合することで、従来チームが担っていた作業量をひとりで処理します。削減されたコストは、デザインの質とスピードに再投資します。']],
];
export const donts = ['不要な月額費用を請求しない', '中身の分からない管理費を取らない', '何もしていないのに発生する請求をしない'];
export const dos = ['必要な費用は「何のために・誰に・いくらかかるか」を必ず事前に説明する', '分からない点はいつでも質問を受け付け、納得してから進める', 'クライアントの利益を最優先に、最適な提案をする'];
export const company = [['屋号', 'Noe Shiftica'], ['代表者名', '奥村 東（オクムラ アズマ）'], ['所在地', '東京都渋谷区道玄坂1丁目10番8号 渋谷道玄坂東急ビル2F−C'], ['サービス内容', 'ウェブサイト制作・デザイン・フロントエンド開発']];

export const legal = [['privacy', 'Privacy Policy'], ['tokusho', '特定商取引法に基づく表記'], ['terms', 'Terms of Service']];
export const social = [['X', 'https://x.com/noeShiftica'], ['GitHub', 'https://github.com/azmok']];
export const tech = [['Next.js', 'Framework'], ['Payload CMS', 'Headless CMS'], ['Tailwind CSS', 'Styling'], ['Cloud AI (Gemini)', 'AI Engine'], ['Firebase App Hosting', 'Hosting'], ['Firebase Cloud Storage', 'Media'], ['Neon', 'Database']];
export const facts = [['15万円〜', 'Liteプランの価格'], ['最短1週間', '公開までの期間'], ['24時間以内', 'ご相談への返信'], ['5ステップ', '公開までの流れ']];
export const audience = ['テンプレートに飽きた方', '制作費が不透明で不安な方', '公開後も育てたいサイトを持ちたい方'];
export const quote = 'デザインとは表面を整えることではない。ブランドの核心を見抜き（Noe）、それを美しい形に転換する（Shiftica）こと。';
export const profile = 'こんにちは、あずまです！AIという最強の武器と、認知科学に基づいたデザインで、あなたのビジネスの本質を形にします。一人で運営しているからこそ、あなたの想いに200%コミットできる。難しいことは全部お任せください！一緒に、世界を驚かせるシフトを起こしましょう！';
