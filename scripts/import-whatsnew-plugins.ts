import 'dotenv/config'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables (.env.local overrides .env)
config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
config({ path: path.resolve(process.cwd(), '.env'), override: false })

const pluginsData = [
  {
    title: '記事作成・更新時の Neon DB 自動バックアップ機能（デモ機能）',
    slug: 'neon-backup-plugin',
    excerpt: '記事の作成や更新を行うと、Neon PostgreSQL データベースのバックアップブランチが自動的に作成され、データの誤削除や上書きから保護するデモ用安全プラグインです。',
    publishedAt: '2026-03-29T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: '記事作成・更新時の Neon DB 自動バックアップ機能 | Noe Shiftica',
      metaDescription: 'Payload CMSで記事を作成・更新した際に、Neonのデータベースブランチを自動でクローン生成しバックアップを確保するデモ機能の解説。'
    },
    markdownContent: `#### 💾 編集ミスや意図しない変更からデータを守る

データベースの堅牢な運用とクライアントへの安全対策デモとして、**Neon DB 自動バックアッププラグイン（\`neon-backup\`）** を実装しました。

#### 🛡️ プラグインの機能
- **自動トリガーバックアップ**: 記事（Posts）などの作成、変更、保存処理が実行された直後に、バックエンドのフックで Neon API を呼び出し、最新のDBステートを持つバックアップブランチ（例: \`backup/pre-deploy\`）を自動作成します。
- **データ破損対策**: 万が一の誤操作や誤削除が発生した場合でも、即座に保存直前のブランチからデータベースを完全復旧させることができます。

Neon の API と連携したサーバーサイドプラグインであり、安全なデータ管理デモとしてご体験いただけます。`
  },
  {
    title: 'ブラウザ強制終了や遷移に対応する自動保存（Autosave）機能（デモ機能）',
    slug: 'autosave-plugin',
    excerpt: '記事執筆中、ローカルストレージを利用して下書きを自動でバックアップ。ブラウザの戻る・進むやクラッシュ時にも執筆状態を安全に復元する機能の紹介です。',
    publishedAt: '2026-04-02T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: '下書きの自動保存（Autosave）機能（デモ機能） | Noe Shiftica',
      metaDescription: 'ブラウザのクラッシュや意図しないページ離脱から執筆中の原稿を守る、LocalStorageを活用した自動保存（Autosave）プラグインのデモ紹介。'
    },
    markdownContent: `#### ✍️ 執筆中の原稿を失わない安心のライティング環境

CMSのエディタで長い記事を書いている際のトラブルを防ぐため、**自動保存プラグイン（\`autosave\`）** を導入しました。

#### 🌟 プラグインの機能
- **ローカル自動保存 (Autosave)**: 記事の編集画面でキー入力を行うたびに、ブラウザの LocalStorage に原稿データが自動的に保存されます。
- **強制離脱からの復元**: 保存ボタンを押す前にブラウザを閉じてしまったり、前のページに戻ってしまった場合でも、再度編集画面を開いた際に「復元しますか？」という警告とともに、直前の状態を完璧にロード・再注入します。
- **復旧の確実性**: ブラウザの進む/戻るキャッシュによる Payload 側のフォームクリア（空上書き）が発生した際も、バックグラウンドで状態を監視して確実にデータを再注入する設計を施しています。`
  },
  {
    title: 'スラッグ変更履歴の自動追跡と 301 リダイレクトプラグイン（デモ機能）',
    slug: 'slug-tracker-redirect',
    excerpt: '記事のURLスラッグを変更した際、過去のスラッグ履歴を自動的にデータベースに保存。旧URLにアクセスしたユーザーを新しいURLへ自動的に301転送します。',
    publishedAt: '2026-05-22T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'スラッグ変更履歴の自動追跡と 301 リダイレクトプラグイン | Noe Shiftica',
      metaDescription: '記事のURLスラッグを変更してもSEO評価を引き継ぐ、スラッグ追跡履歴と自動301転送プラグインのデモ機能解説。'
    },
    markdownContent: `#### 🔗 記事のURL変更時もリンク切れを起こさずSEOを引き継ぐ

ブログの運営中によくある「記事のURL（スラッグ）を変更したい」という要望に安全に対応するため、**スラッグトラッカー＆301リダイレクトプラグイン（\`slugTracker\`）** を開発しました。

#### 🛠️ プラグインの機能
- **スラッグ変更履歴（slugHistory）の自動収集**: 記事の編集画面でスラッグを書き換えて保存すると、過去のスラッグが配列として自動蓄積されます。
- **インテリジェント301リダイレクト**: 旧スラッグのURL（例: \`/blog/old-slug\`）にアクセスがあった場合、データベースから過去の履歴を検索。ヒットした場合は、最新のURL（例: \`/blog/new-slug\`）へ自動的にHTTP 301（恒久的な移動）リダイレクトを実行します。

これにより、SNSにシェアされた古いリンクを踏んだユーザーも迷わせず、検索エンジンのSEOスコアを損なわずに安全な移行が可能になります。`
  },
  {
    title: 'リッチテキストをワンクリックで Markdown 変換・コピー（デモ機能）',
    slug: 'markdown-copy-plugin',
    excerpt: 'エディタで作成したコンテンツを、HTMLやプレーンテキストではなく、完全な Markdown 形式に一瞬で変換してクリップボードにコピーできるプラグインを実装しました。',
    publishedAt: '2026-05-22T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'リッチテキストをワンクリックで Markdown 変換・コピー | Noe Shiftica',
      metaDescription: 'PayloadのLexicalエディタ上で書いたリッチテキストを、クリックひとつでマークダウン形式に変換・クリップボードコピーできるデモ機能のご紹介。'
    },
    markdownContent: `#### 📋 別のプラットフォームやドキュメント管理への出力が容易に

エディタ上のコンテンツを再利用しやすくするため、**Markdownコピープラグイン（\`markdownCopyPlugin\`）** を作成しました。

#### 🚀 プラグインの機能
- **ワンクリックMarkdown変換**: リッチテキストエディタのツールバーに配置された専用のコピーボタンを押すことで、現在編集中の見出し、文字装飾、コードブロック、リストなどを標準的な Markdown テキストにその場で相互変換します。
- **クリップボード連携**: 変換されたテキストは即座にクリップボードにコピーされるため、GitHub の Issue やドキュメントツール等にそのまま貼り付けることができます。`
  },
  {
    title: 'エディタとプレビューを自由に変更できるドラッグリサイズパネル（デモ機能）',
    slug: 'live-preview-resizer',
    excerpt: 'PCビューでのライブプレビュー中に、ドラッグ＆ドロップでエディタ幅とプレビュー幅を自由に調整できるリサイズハンドル機能。',
    publishedAt: '2026-05-30T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'エディタとプレビューを自由に変更できるドラッグリサイズパネル | Noe Shiftica',
      metaDescription: 'Payload CMS標準の画面レイアウトを拡張し、ドラッグ＆ドロップでエディタとライブプレビューの横幅を比率調整できる便利なUIリサイザープラグインのデモ紹介。'
    },
    markdownContent: `#### 📐 編集画面のレイアウトを直感的にカスタマイズ

Payload CMS v3 の標準ライブプレビューは画面半分に固定されていますが、執筆しやすくするために横幅を自由に変更できる **ライブプレビュー・パネルリサイザープラグイン（\`panelResizer\`）** を開発しました。

#### 🎨 プラグインの機能
- **ドラッグ＆ドロップリサイズ**: エディタとプレビュー画面の境界に配置されたライムグリーンのリサイズハンドルをドラッグするだけで、任意の比率に横幅を調節できます。
- **モバイル対応**: PCビュー（1024px以上）でのみリサイズハンドルを注入し、スマホやタブレット縦画面では元のレスポンシブ配置に自動でクリーンアップされる親切設計です。
- **滑らかなインタラクション**: PointerEvents API と \`requestAnimationFrame\` による最適化で、ドラッグ中のレイアウト追従が非常に滑らかです。`
  },
  {
    title: 'アイキャッチ画像から OGP 画像を自動生成・補完するプラグイン（デモ機能）',
    slug: 'og-image-autofill-plugin',
    excerpt: '記事に設定されたアイキャッチ画像をベースに、SNSシェア用の OGP 画像（1200x630サイズ）を自動設定する仕組みをフックに組み込みました。',
    publishedAt: '2026-05-31T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'アイキャッチ画像から OGP 画像を自動生成・補完するプラグイン | Noe Shiftica',
      metaDescription: '記事を保存する際に、設定されたカバー画像をベースとしてSNS用のOGPメタタグ画像を自動的に補完登録するSEOプラグインの解説。'
    },
    markdownContent: `#### 📱 SNSシェア時の見栄えを全自動で最適化

Twitter/X や Facebook 等に記事がシェアされた際の表示品質を高めるための **OGP画像自動補完プラグイン（\`ogImageAutoFill\`）** を構築しました。

#### 🚀 プラグインの機能
- **自動OG画像生成フック**: 記事にアイキャッチ画像（Featured Image / Cover Image）を設定して保存すると、バックエンドの \`beforeChange\` フックが走り、SNSに最適な 1200x630 のアスペクト比を持ったOGP専用画像を自動生成して SEO グループの \`ogImage\` 欄に自動補完します。
- **SEO漏れの防止**: 記事ごとに個別のOGP用画像をアップロードする手間が省け、設定忘れによるデフォルト画像へのフォールバックを最小限に防ぎます。`
  },
  {
    title: 'Monaco/CodeMirror 連携 HTML ソースビューワーと構文チェック（デモ機能）',
    slug: 'html-source-viewer-demo',
    excerpt: 'WYSIWYG エディタからワンクリックで HTML ソースコード表示に切り替え。リアルタイムに HTMLHint が構文エラーを検知・警告します。',
    publishedAt: '2026-05-31T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'Monaco/CodeMirror 連携 HTML ソースビューワーと構文チェック | Noe Shiftica',
      metaDescription: 'WYSIWYGリッチテキストエディタの裏側のHTMLソースを直接高精度エディタで確認・編集でき、リアルタイムに構文チェックを行うプラグインのデモ紹介。'
    },
    markdownContent: `#### 💻 自由な HTML 編集とリアルタイムなエラー診断

ビジュアルエディタ（WYSIWYG）だけでは表現が難しい高度なコーディングをCMS上で行うため、**HTMLソースコードビューワープラグイン（\`htmlSourceViewer\`）** を実装しました。

#### 🛠️ プラグインの機能
- **インプレースコードビューワー**: ツールバーの「</>」ボタンを押すことで、WYSIWYGのエディタ画面そのものが瞬時にフル機能のコードエディタ（CodeMirror 6）に切り替わります。
- **HTMLHint によるリアルタイム検証**: ソースコードを編集すると、裏側で HTMLHint が構文チェックを実行。閉じタグ忘れや無効な要素がある場合は、赤波線で警告し、下部の診断パネルにエラー詳細をリアルタイムで出力します。
- **自動コード整形**: js-beautify と連携し、ワンクリックでネストを揃えてインデントされた綺麗な HTML コードに自動整形します。`
  },
  {
    title: 'カスタムフォントカラー＆フォントサイズ数値入力ツールバー（デモ機能）',
    slug: 'text-style-toolbar-demo',
    excerpt: 'エディタのツールバーに、カラーパレットから自由な文字色を割り当てたり、Figmaのように直接数値を入力してフォントサイズを変更できる入力欄を搭載。',
    publishedAt: '2026-05-31T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'カスタムフォントカラー＆フォントサイズ数値入力ツールバー | Noe Shiftica',
      metaDescription: '文字色変更やFigmaライクな直接数値指定によるフォントサイズ変更を可能にする、Lexicalエディタ用カスタムツールバープラグインのデモ機能解説。'
    },
    markdownContent: `#### 🎨 自由自在な文字装飾とタイポグラフィ設計

CMSで表現力豊かなコンテンツを作成するための、**テキストスタイルカスタマイザープラグイン（\`textStyle\`）** のデモです。

#### 🌟 プラグインの機能
- **カスタムカラーパレット**: 選択したテキストに対し、システム既定のカラーだけでなく、カラーピッカーから任意のカラー（RGB/Hex）を指定して文字色を自由に変更可能です。
- **Figmaライクなフォントサイズ指定**: 従来のプルダウン選択ではなく、入力欄に直接「18px」「1.2rem」などの任意の数値を入力し、エンターキーやフォーカスアウトで直感的にサイズ指定を適用できます。
- **スタイル復元**: Markdown貼り付けや編集時にも、インラインカラー情報がドロップしないよう、フロントエンド側でカスタムJSXコンバーターと連動する仕組みとなっています。`
  },
  {
    title: 'リッチテキストエディタ内での「検索と置換（Search & Replace）」機能（デモ機能）',
    slug: 'search-replace-plugin',
    excerpt: '長文の記事を執筆する際に便利な、エディタ専用のテキスト検索＆置換パネルをツールバーに統合しました。',
    publishedAt: '2026-06-03T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'リッチテキストエディタ内での検索と置換（Search & Replace）機能 | Noe Shiftica',
      metaDescription: '長文の編集に便利な、Lexicalエディタ上にインラインで表示されるテキスト検索・一括置換プラグインのデモ機能紹介。'
    },
    markdownContent: `#### 🔍 記事全体のテキストキーワード変更を一発で処理

長文記事の編集や語句の統一作業を効率化するため、**検索＆置換プラグイン（\`searchReplace\`）** をエディタツールバーに統合しました。

#### 🚀 プラグインの機能
- **インライン検索パネル**: ツールバーの検索アイコンを押すと、エディタ上部にスッキリとした検索・置換パネルが出現します。
- **リアルタイムキーワード一致表示**: 検索窓に入力したテキストと一致する文字が、エディタ上でリアルタイムにハイライト表示されます。
- **「置換」および「すべて置換」**: 特定の単語を新しい単語にひとつずつ置換する機能と、記事内の該当するキーワードを一括でまとめて置換する、ワードプロセッサ同等の編集機能を備えています。`
  }
]

// Helper to parse inline markdown (bold ** and inline code `) into Lexical text nodes
function parseInlineMarkdown(text: string) {
  const result: any[] = [];
  let isBold = false;
  let isCode = false;
  let currentText = '';
  
  let i = 0;
  while (i < text.length) {
    const isBoldMatch = text.slice(i, i + 2) === '**';
    const isCodeMatch = text[i] === '`';

    if (isBoldMatch || isCodeMatch) {
      if (currentText !== '') {
        let format = 0;
        if (isBold) format += 1; // IS_BOLD
        if (isCode) format += 16; // IS_CODE
        result.push({
          type: 'text',
          text: currentText,
          detail: 0,
          format: format,
          mode: 'normal' as const,
          style: '',
          version: 1
        });
        currentText = '';
      }

      if (isBoldMatch) {
        isBold = !isBold;
        i += 2;
      } else {
        isCode = !isCode;
        i += 1;
      }
    } else {
      currentText += text[i];
      i += 1;
    }
  }

  if (currentText !== '') {
    let format = 0;
    if (isBold) format += 1;
    if (isCode) format += 16;
    result.push({
      type: 'text',
      text: currentText,
      detail: 0,
      format: format,
      mode: 'normal' as const,
      style: '',
      version: 1
    });
  }

  return result.filter(node => node.text !== '');
}

// Convert markdown structure to Lexical block structure
function convertMarkdownToLexical(markdown: string) {
  const lines = markdown.split('\n')
  const children: any[] = []

  let inList = false
  let listItems: any[] = []

  for (let line of lines) {
    const trimmed = line.trim()

    // Handle empty lines
    if (trimmed === '') {
      if (inList) {
        children.push({
          type: 'list',
          listType: 'bullet' as const,
          tag: 'ul' as const,
          format: '' as const,
          indent: 0,
          version: 1,
          children: listItems
        })
        inList = false
        listItems = []
      }
      continue
    }

    // Handle Headers (####)
    if (trimmed.startsWith('#### ')) {
      if (inList) {
        children.push({
          type: 'list',
          listType: 'bullet' as const,
          tag: 'ul' as const,
          format: '' as const,
          indent: 0,
          version: 1,
          children: listItems
        })
        inList = false
        listItems = []
      }
      children.push({
        type: 'heading',
        tag: 'h4' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: parseInlineMarkdown(trimmed.replace('#### ', ''))
      })
      continue
    }

    // Handle Bullet points (- )
    if (trimmed.startsWith('- ')) {
      inList = true
      listItems.push({
        type: 'listitem',
        value: listItems.length + 1,
        children: parseInlineMarkdown(trimmed.replace('- ', '')),
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1
      })
      continue
    }

    // Handle Quote block (> )
    if (trimmed.startsWith('> ')) {
      if (inList) {
        children.push({
          type: 'list',
          listType: 'bullet' as const,
          tag: 'ul' as const,
          format: '' as const,
          indent: 0,
          version: 1,
          children: listItems
        })
        inList = false
        listItems = []
      }
      children.push({
        type: 'quote',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: parseInlineMarkdown(trimmed.replace('> ', ''))
      })
      continue
    }

    // Regular paragraphs
    if (inList) {
      children.push({
        type: 'list',
        listType: 'bullet' as const,
        tag: 'ul' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        children: listItems
      })
      inList = false
      listItems = []
    }

    children.push({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: parseInlineMarkdown(line)
    })
  }

  if (inList) {
    children.push({
      type: 'list',
      listType: 'bullet' as const,
      tag: 'ul' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: listItems
    })
  }

  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: children.length > 0 ? children : [
        {
          type: 'paragraph',
          format: '' as const,
          indent: 0,
          version: 1,
          direction: 'ltr' as const,
          children: [
            {
              type: 'text',
              text: '',
              detail: 0,
              format: 0,
              mode: 'normal' as const,
              style: '',
              version: 1
            }
          ]
        }
      ]
    }
  }
}

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../src/payload.config')
  const payload = await getPayload({ config: configPromise })

  console.log('Purging existing whats-new plugin entries with matching slugs to avoid duplication...')
  for (const entry of pluginsData) {
    const existing = await payload.find({
      collection: 'whats-new',
      where: { slug: { equals: entry.slug } },
      overrideAccess: true,
    })
    for (const doc of existing.docs) {
      await payload.delete({
        collection: 'whats-new',
        id: doc.id,
        overrideAccess: true,
      })
      console.log(`- Deleted existing plugin article: "${doc.title}" (ID: ${doc.id})`)
    }
  }

  console.log(`\nStarting import of ${pluginsData.length} "What's New" plugin articles...`)
  let count = 0
  for (const entry of pluginsData) {
    try {
      const { markdownContent, ...baseData } = entry
      const lexicalContent = convertMarkdownToLexical(markdownContent)
      
      const doc = await payload.create({
        collection: 'whats-new',
        data: {
          ...baseData,
          content: lexicalContent as any,
        },
        overrideAccess: true,
      })
      console.log(`✓ Created: "${doc.title}" (Slug: ${doc.slug}, ID: ${doc.id})`)
      count++
    } catch (err) {
      console.error(`✗ Failed to import "What's New" plugin entry: ${entry.title}`, err)
    }
  }
  console.log(`\nImport completed successfully. Imported ${count}/${pluginsData.length} plugin articles.`)
  process.exit(0)
}

run().catch(err => {
  console.error('Import process failed:', err)
  process.exit(1)
})
