import { config } from 'dotenv'
import path from 'path'

// Load environment variables (.env.local overrides .env)
config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
config({ path: path.resolve(process.cwd(), '.env'), override: false })

const changelogData = [
  // --- 2026-06-19 ---
  {
    version: 'v1.5.0',
    date: '2026-06-19',
    category: 'Changed' as const,
    status: 'draft' as const,
    changes: [
      { text: '管理画面の全コードエディタ（HTMLソース、HTMLホスティング、JSONメタデータ）を CodeMirror 6（@uiw/react-codemirror）に統一。ライト/ダークテーマ of 自動追従と VS Code 風ダークテーマを適用' }
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026-06-19',
    category: 'Added' as const,
    status: 'draft' as const,
    changes: [
      { text: 'ブログ記事本文内のリンクに常時アンダーラインと右上の外部リンクマークを表示するスタイルを追加' },
      { text: 'リンクホバー時の専用ネオンライム色カスタムカーソル（.link-cursor）を実装' },
      { text: '更新情報を提示するための Changelog および What\'s New ページを追加' }
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026-06-19',
    category: 'Fixed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'Monaco Editor が入力イベントを横取りし、矢印キー移動やコピペができなくなっていたバグを修正' },
      { text: 'サイドバーJSON編集欄（customMetaData）の動的再計算暴走によるレイアウト崩壊を固定高さ（320px）化で解決' }
    ]
  },
  // --- 2026-06-17 ---
  {
    version: 'v1.4.0',
    date: '2026-06-17',
    category: 'Added' as const,
    status: 'draft' as const,
    changes: [
      { text: 'HTMLホスティング機能（hosted-pages コレクション、/p/[slug]配信ルート、プラグイン src/plugins/html-hosting/）を新規追加。管理画面の3分割コード編集および自動パースに対応' }
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-06-17',
    category: 'Changed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'モバイル環境における管理画面のリッチテキスト編集領域のUXを調整し、入力スペースを最大化' }
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-06-17',
    category: 'Fixed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'pnpm payload migrate が出力ゼロで無限ハングする問題（確認プロンプトの stdin 待ち）を spawnSync の y 入力により回避' }
    ]
  },
  // --- 2026-06-15 ---
  {
    version: 'v1.3.0',
    date: '2026-06-15',
    category: 'Fixed' as const,
    status: 'draft' as const,
    changes: [
      { text: '本番環境（noe-shiftica.com）におけるパスキー（WebAuthn）および 2FA ログインの動作安定性を検証・修正' },
      { text: 'Gemini API キー無効時に管理画面の UI 上に分かりやすいエラー警告（インライン警告）を表示するようハンドリング強化' },
      { text: 'Markdownペースト時のコードブロック消失バグ、およびデフォルトコンバーターでインラインの文字色/サイズが消えるバグを修正' }
    ]
  },
  // --- 2026-06-14 ---
  {
    version: 'v1.2.0',
    date: '2026-06-14',
    category: 'Added' as const,
    status: 'draft' as const,
    changes: [
      { text: 'Touch ID / Face ID などの生体認証を利用した WebAuthn / パスキーログイン機能を追加' },
      { text: 'パスワード認証に加えてパスキーを要求するセキュアな 2要素認証（2FA）ログインフローを実装' }
    ]
  },
  {
    version: 'v1.2.0',
    date: '2026-06-14',
    category: 'Fixed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'SEO向上のため全フロントエンドページに canonical タグを自動付与。All pages\' canonical が root に向くバグを解消' },
      { text: 'sitemap.xml の最終更新日時の精度向上、およびプレビュー用の動的ルートの noindex 設定を適用' }
    ]
  },
  // --- 2026-06-03 ---
  {
    version: 'v1.1.0',
    date: '2026-06-03',
    category: 'Added' as const,
    status: 'draft' as const,
    changes: [
      { text: 'ブログ記事ページに構造化データ（Organization + BlogPosting JSON-LD）を自動挿入する機能を追加' },
      { text: 'リッチテキストエディタのテキストスタイルツールバーに「検索＆置換」機能を追加' }
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-06-03',
    category: 'Fixed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'TextStyleToolbar でフォントサイズを数字入力する際の入力挙動、および React/ESLint ルール違反を修正' },
      { text: '自動バックアップスクリプトにおける PSModulePath 関連の動作不具合を修正' }
    ]
  },
  // --- 2026-05-31 ---
  {
    version: 'v1.0.1',
    date: '2026-05-31',
    category: 'Added' as const,
    status: 'draft' as const,
    changes: [
      { text: '記事のアイキャッチ画像から OGP 画像タグを自動生成・補完する ogImageAutoFillPlugin を導入' },
      { text: 'HTMLソースビューワーに Monaco Editor を導入し、HTMLHint による構文チェック機能を追加' },
      { text: 'フォントサイズ選択欄を Figma スタイルの直接入力入力フィールドに置き換え' }
    ]
  },
  {
    version: 'v1.0.1',
    date: '2026-05-31',
    category: 'Changed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'Firebase App Hosting の環境変数管理（apphosting.yaml env 設定キーと Secret Manager の権限設定）を修正し、同期漏れを解決' }
    ]
  },
  // --- 2026-05-30 ---
  {
    version: 'v1.0.0',
    date: '2026-05-30',
    category: 'Added' as const,
    status: 'draft' as const,
    changes: [
      { text: 'ライブプレビュー画面でエディタとプレビューの境界をドラッグ＆ドロップでサイズ変更できるリサイズ機能を実装' },
      { text: 'html-files コレクションのライブプレビュー機能（アコーディオン切り替え、スティッキーヘッダー）を追加' },
      { text: 'カテゴリのトリム対応重複登録防止バリデーションを Categories コレクションに追加' },
      { text: '実績・問い合わせ時の「ご予算感」自動連動ロジックの実装' }
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-05-30',
    category: 'Fixed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'ブラウザ「戻る・進む」遷移時の画像消失バグを sessionStorage キャッシュで解消' },
      { text: 'GCS 画像の読み込み速度を直結 URL 参照とキャッシュ最適化により 0.1秒台に高速化' },
      { text: 'Next.js unstable_noStore 導入によるブログ詳細ページの画像更新タイムラグ（キャッシュ残り）の解消' },
      { text: 'Firebase App Hosting Google CDN のキャッシュ永久化バグを、Next.jsのon-demand revalidateとプラットフォーム連動により解決' },
      { text: '管理画面の画像切り抜きツール（Image Cropper）が overflow: hidden により枠線ハンドルをクリップしていた表示崩れを修正' }
    ]
  },
  // --- 2026-05-22 ---
  {
    version: 'v0.9.0',
    date: '2026-05-22',
    category: 'Added' as const,
    status: 'draft' as const,
    changes: [
      { text: '開発者向けの技術ブログ枠として /dev 配信ルートおよび tech-posts コレクションを追加' },
      { text: '記事スラッグ変更時の履歴保存および旧スラッグからの301リダイレクト自動化プラグインを追加' },
      { text: '記事作成・更新時に自動で Neon DB のバックアップブランチを作成するプラグインを導入' }
    ]
  },
  {
    version: 'v0.9.0',
    date: '2026-05-22',
    category: 'Changed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'ブログ詳細ページのタイポグラフィを Airbnb Newsroom 基準（本文18pxなど）に刷新' },
      { text: 'プレビューページおよび静的ページ（規約やポリシー等）のテーマをブランドカラーのダーク Void に統合' }
    ]
  },
  {
    version: 'v0.9.0',
    date: '2026-05-22',
    category: 'Fixed' as const,
    status: 'draft' as const,
    changes: [
      { text: 'モバイル版 Google Chrome および Safari でダブルタップズームが発生し UI が拡大してしまうズームバグを viewport meta で修正' }
    ]
  },
  // --- 2026-05-15 ---
  {
    version: 'v0.1.0',
    date: '2026-05-15',
    category: 'Added' as const,
    status: 'draft' as const,
    changes: [
      { text: 'Next.js + PayloadCMS v3 基盤の立ち上げおよび Firebase / Neon / GCS インフラ構築' },
      { text: 'ダーク・ニューモーフィズム調の Landing Page、About、Services ページ（ヒアリングシート）を初期実装' }
    ]
  }
]

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../src/payload.config')
  const payload = await getPayload({ config: configPromise })

  console.log(`Starting import of ${changelogData.length} entries...`)
  let count = 0
  for (const entry of changelogData) {
    try {
      const doc = await payload.create({
        collection: 'changelog',
        data: entry,
      })
      console.log(`✓ Created: [${doc.date}] ${doc.category} (ID: ${doc.id})`)
      count++
    } catch (err) {
      console.error(`✗ Failed to import entry: ${entry.date} - ${entry.category}`, err)
    }
  }
  console.log(`\nImport completed successfully. Imported ${count}/${changelogData.length} entries.`)
  process.exit(0)
}

run().catch(err => {
  console.error('Import process failed:', err)
  process.exit(1)
})
