import { config } from 'dotenv'
import path from 'path'

// Load environment variables (.env.local overrides .env)
config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
config({ path: path.resolve(process.cwd(), '.env'), override: false })

const whatsNewData = [
  {
    title: 'WebAuthn パスキー認証 ＆ 2要素認証（2FA）によるセキュアな管理画面デモ',
    slug: 'passkey-2fa-security-demo',
    excerpt: '従来のID・パスワードに加えて Touch ID / Face ID などの生体認証（パスキー）と、セキュリティを高める2段階認証（2FA）による強固なセキュリティを管理画面に統合しました。',
    publishedAt: '2026-06-14T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'WebAuthn パスキー認証 ＆ 2要素認証（2FA）によるセキュアな管理画面デモ',
      metaDescription: '従来のID・パスワードに加え Touch ID / Face ID などの生体認証（パスキー）と2要素認証（2FA）を管理画面に統合。セキュリティを飛躍的に高めるデモ機能のご紹介です。'
    },
    markdownContent: `#### 🛡️ 管理画面のセキュリティを劇的に強化する実用デモ

このサイトは Payload CMS のデモサイトを兼ねており、実際のクライアントワークで要求される高度なセキュリティ機能の実装サンプルとして、**WebAuthn / パスキー認証** および **2要素認証（2FA）** を管理画面に搭載しました。

#### 🔑 実装されているデモ機能
- **生体認証（パスキー）ログイン**: PC の指紋認証やスマートフォンの顔認証（Face ID / Touch ID / Windows Hello）を使用して、パスワードレスで素早く、フィッシング耐性の高いセキュアなログインを体験できます。
- **2要素認証 (2FA) ログインフロー**: ID・パスワードによる第1要素認証の後、認証済みデバイス（スマホなど）でのパスキー承認を第2要素として求める強固なログインフローを実装しました。

これらは \`@simplewebauthn\` を用いて構築されており、外部の認証 SaaS に依存しない自前ホスト型の安全なセキュリティ設計となっています。`
  },
  {
    title: 'HTMLホスティング機能と HTML / CSS / JS 3分割コードエディタ（デモ機能）',
    slug: 'html-hosting-standalone-demo',
    excerpt: 'デベロッパーやデザイナーが管理画面から HTML / CSS / JS を個別に編集し、専用URL `/p/[slug]` から直接配信できるHTMLホスティングプラグインを実装しました。',
    publishedAt: '2026-06-17T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'HTMLホスティング機能と HTML / CSS / JS 3分割コードエディタ',
      metaDescription: '管理画面から HTML / CSS / JS を個別に直接コーディング編集・アップロードし、スタンドアロンページとして専用URLから瞬時に公開配信できるデモ機能の解説です。'
    },
    markdownContent: `#### ⚡ デプロイ不要で独立したページを瞬時に公開

キャンペーン用のLPやプロトタイプなど、Next.js アプリケーション全体の再デプロイをすることなく、独立したHTMLページを即座に公開できる **HTMLホスティング機能** のデモです。

#### 🛠️ デモで体験できる機能
- **3分割 CodeMirror 6 エディタ**: HTML / CSS / JS のコードを別々のエディタで快適に編集可能。ダークテーマ連動やVS Code風シンタックスハイライトを備えています。
- **HTMLの自動パースアップロード**: 手元のHTMLファイルを管理画面にアップロードすると、内部の \`<style>\` や \`<script>\` を自動で解析・分離し、各エディタに自動で流し込みます。
- **スタンドアロン配信 (/p/[slug])**: サイトのヘッダーやフッター、グローバルスタイルに干渉されない、完全な「1枚の独立したHTML」として高速に配信します。`
  },
  {
    title: 'Gemini AI 連携コンテンツオプティマイザーによる記事自動作成サポート（デモ機能）',
    slug: 'ai-content-optimizer-demo',
    excerpt: 'Google Gemini API と連携し、記事要約、SEOメタデータ、カテゴリの自動選択をワンクリックで行うAIコンテンツアシスタントを搭載。',
    publishedAt: '2026-06-15T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'Gemini AI 連携コンテンツオプティマイザーによる記事自動作成サポート',
      metaDescription: 'Google Gemini APIと連携し、記事の自動要約、SEOメタデータ生成、スマートカテゴリ自動分類をワンクリックで行うAI Content Optimizerのデモ機能です。'
    },
    markdownContent: `#### 🤖 AIが執筆とSEOメタデータ入力を強力アシスト

日々のコンテンツ運用において、執筆クオリティの担保とSEO設定の入力を自動化する **AI Content Optimizer** のデモ機能です。

#### 🌟 デモで体験できる機能
- **SEOメタデータ（タイトル・説明文）の自動生成**: 本文を解析し、検索エンジンに最適化されたメタタイトルとディスクリプションをAIが自動提案・入力します。
- **パラメータの個別生成制御**: 必要なパラメータ（要約、ディスクリプションなど）のみをチェックボックスで個別に選択してAIに生成させることができます。
- **カテゴリのスマート自動選択**: 記事の文脈を判断し、登録済みのカテゴリ群から最適なカテゴリを自動的に選択・紐付けます。

Google の最新モデル \`gemini-2.5-flash\` と API 連携しており、実用的なコンテンツ生成スピードを体験できます。`
  },
  {
    title: 'Markdownインポーターと日本語タイトル自動翻訳スラグ生成（デモ機能）',
    slug: 'markdown-importer-slug-demo',
    excerpt: '`.md` ファイルやマークダウンテキストをドラッグ＆ドロップでインポートする機能と、日本語タイトルを自動翻訳して英語スラグにする画期的なプラグインを実装。',
    publishedAt: '2026-05-31T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'Markdownインポーターと日本語タイトル自動翻訳スラグ生成（デモ機能）',
      metaDescription: 'Markdownドキュメントのアップロードによる記事の即時流し込みと、日本語タイトルから英語自動翻訳によるURLスラッグ生成を行うデモ機能の紹介。'
    },
    markdownContent: `#### 📝 既存の記事資産やローカル原稿をスムーズに移行

ローカル環境や他のブログプラットフォームで書かれた Markdown 資産を、Payload CMS に一瞬で取り込める **Markdown Importer** です。

#### 🚀 実装されているデモ機能
- **ドラッグ＆ドロップインポート**: Markdown 形式（.md）のファイルやテキストを流し込むと、見出し、箇条書き、テーブル構造などをそのまま Lexical リッチテキスト形式に自動パースしてエディタに展開します。
- **自動翻訳スラグ生成**: 日本語で記事タイトルを入力して保存すると、Google 翻訳 API を経由してタイトルを自動で英語に翻訳し、クリーンな URL 用の英語スラグ（例: \`markdown-importer-slug-demo\`）を自動生成します。`
  },
  {
    title: 'ブログ一覧の「スイススタイル＆Masonryグリッド」UIリニューアル',
    slug: 'swiss-style-blog-ui',
    excerpt: 'ブログ記事一覧ページ（/blog、/dev）のデザインを一新。2カラムMasonryレイアウトや専用ホバーカスタムカーソルを導入しました。',
    publishedAt: '2026-06-19T00:00:00.000Z',
    status: 'draft' as const,
    seo: {
      metaTitle: 'ブログ一覧の「スイススタイル＆Masonryグリッド」UIリニューアル',
      metaDescription: 'ブログ一覧ページのデザインを、視覚的・構造的に優れたスイススタイルおよび2カラムMasonryグリッドに大幅リニューアル。新しいカスタムカーソルホバーも搭載。'
    },
    markdownContent: `#### 📐 表側の UI/UX における新ビジュアル体験

本サイトの閲覧体験を高めるため、ブログトップ（\`/blog\`）および開発技術ブログ（\`/dev\`）の一覧画面を、モダンで洗練された **スイス・グリッドスタイル** へリニューアルしました。

#### 🎨 主な更新内容（一般ユーザー向け）
- **2カラム Masonry グリッド**: 縦横のサイズ比率に合わせてカードがダイナミックに配置され、雑誌のコラージュのような先進的なグリッドレイアウトを実現。
- **専用リンクカーソル**: 本文中のハイパーリンクにホバーすると、丸いライムグリーンのポインター（\`.link-cursor\`）へ吸い付くように変化するマグネットカーソル効果を適用。
- **外部リンクの可視化**: 記事本文のリンクが外部リンクの場合、右上に自動で「新しいタブを開く」アイコンが表示され、かつ常時アンダーラインでリンクの視認性を高めました。`
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

    // Regular paragraphs (including inline bold/code handling)
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

  // Flush remaining list items if any
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

  console.log('Purging existing whats-new entries with matching slugs to avoid duplication...')
  for (const entry of whatsNewData) {
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
      console.log(`- Deleted existing article: "${doc.title}" (ID: ${doc.id})`)
    }
  }

  console.log(`\nStarting import of ${whatsNewData.length} "What's New" articles...`)
  let count = 0
  for (const entry of whatsNewData) {
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
      console.error(`✗ Failed to import "What's New" entry: ${entry.title}`, err)
    }
  }
  console.log(`\nImport completed successfully. Imported ${count}/${whatsNewData.length} articles.`)
  process.exit(0)
}

run().catch(err => {
  console.error('Import process failed:', err)
  process.exit(1)
})
