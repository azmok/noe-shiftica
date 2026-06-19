import { config } from 'dotenv'
import path from 'path'

// Load environment variables (.env.local overrides .env)
config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
config({ path: path.resolve(process.cwd(), '.env'), override: false })

/**
 * Comprehensive changelog re-seed.
 *
 * Rebuilds the entire `changelog` collection from the real git history
 * (2026-02-24 project init → 2026-06-19), with accurate dates, monotonic
 * semver, and de-duplicated entries (e.g. neon-backup moved to its true
 * 2026-03-29 origin instead of being attributed to 2026-05-22).
 *
 * All entries are published per Azuma's explicit instruction.
 */
const changelogData = [
  // ===== v0.1.0 — 2026-02-24 : プロジェクト基盤 =====
  {
    version: 'v0.1.0', date: '2026-02-24', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'Next.js + Payload CMS v3 を基盤にプロジェクトを立ち上げ。Firebase App Hosting / Neon PostgreSQL / Google Cloud Storage(GCS) のインフラ構築と初回デプロイを完了' },
      { text: 'Resend 連携によるお問い合わせフォーム（メール送信）を実装' },
    ],
  },

  // ===== v0.2.0 — 2026-03-06 : デザインシステム =====
  {
    version: 'v0.2.0', date: '2026-03-06', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'ダーク／ニューモーフィズム調の Landing Page・About・規約／ポリシーページを実装' },
      { text: 'スクロール連動のヘッダー透過・背景ぼかし（backdrop-filter、モバイル Webkit 対応含む）を実装' },
      { text: '5種類の HTML ニューモーフィズム・フォールバック画像を React コンポーネント化し、記事サムネイル不在時にランダム表示' },
      { text: 'Payload にドラフト／公開ステータスを追加し、フロントエンドは公開記事のみ表示するよう制限' },
    ],
  },
  {
    version: 'v0.2.0', date: '2026-03-06', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: 'フォントを Adobe Fonts（Source Han Sans／Serif JP）へ全面移行し、見出しに Oxanium を適用' },
    ],
  },
  {
    version: 'v0.2.0', date: '2026-03-06', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'App Hosting の環境変数(FIREBASE_CONFIG)と Application Default Credentials に対応するよう GCS 設定を動的解決へ修正' },
      { text: 'React ハイドレーションエラー(Error 418)を、Link 内の button タグを div/span へ置換することで解消' },
    ],
  },

  // ===== v0.3.0 — 2026-03-07 : Markdown インポート & 自動スラッグ =====
  {
    version: 'v0.3.0', date: '2026-03-07', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'Lexical エディタへの Markdown ペースト自動パース／リッチテキスト変換プラグイン(markdownImport)を実装' },
      { text: '日本語タイトルを Google 翻訳で英語化し、クリーンな URL スラッグを自動生成する機能を追加' },
      { text: 'ブログ記事に前後記事へのナビゲーションリンクを追加' },
    ],
  },
  {
    version: 'v0.3.0', date: '2026-03-07', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'Markdown テーブルのペースト時にブラウザがフリーズ（無限ループ）する不具合を、ヘッドレスエディタ方式で修正' },
    ],
  },

  // ===== v0.4.0 — 2026-03-12 : 自動保存(Autosave) =====
  {
    version: 'v0.4.0', date: '2026-03-12', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'ブログ編集画面に LocalStorage を用いた自動保存(Autosave)機能を実装' },
    ],
  },
  {
    version: 'v0.4.0', date: '2026-03-12', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'ブラウザの「進む／戻る」キャッシュで Payload がフォームを空状態で上書きし下書きが消える問題を、監視インターバルでの再注入により修正' },
      { text: 'Three.js コンテキスト破棄によるフリーズ、およびタグページの JSON クエリ(APIError)を修正' },
    ],
  },

  // ===== v0.5.0 — 2026-03-22 : 計測 =====
  {
    version: 'v0.5.0', date: '2026-03-22', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'Google Analytics を導入（計測コンポーネント作成・レイアウト埋め込み・環境設定）' },
    ],
  },

  // ===== v0.6.0 — 2026-03-29 : AI・HTML管理・SEO・DBバックアップ =====
  {
    version: 'v0.6.0', date: '2026-03-29', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'Gemini API 連携の AI コンテンツオプティマイザー（記事要約・SEOメタデータ・カテゴリの自動選択）を実装' },
      { text: '任意の HTML ファイルを取り込み・管理できる html-files コレクション（埋め込み HTML 管理）を追加。AI オプティマイザーの HTML インポートにも対応' },
      { text: '動的な sitemap.xml / robots.txt の生成機能と canonical タグ設定を追加' },
      { text: '記事の作成・更新時に Neon DB のバックアップブランチを自動作成するプラグイン(neon-backup)を導入' },
    ],
  },
  {
    version: 'v0.6.0', date: '2026-03-31', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: 'html-files の一覧画面を整理し、紐付く記事を表示するよう改善' },
    ],
  },

  // ===== v0.7.0 — 2026-04-02 : スイススタイル =====
  {
    version: 'v0.7.0', date: '2026-04-02', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: 'ブログの「Recent Stories」セクションに、アバンギャルドなスイス・グリッドスタイルのレイアウトを導入' },
    ],
  },

  // ===== v0.8.0 — 2026-04-03 : Masonry グリッド（旧 swiss-style-blog-ui） =====
  {
    version: 'v0.8.0', date: '2026-04-03', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: 'ブログ一覧（/blog・/dev）を 2カラム Masonry グリッドへ刷新。カードを縦横比に応じて雑誌コラージュ風にダイナミック配置' },
      { text: '本文リンクにホバーで吸着するライムグリーンのカスタムカーソル(.link-cursor)など、視覚的・触覚的インタラクションを全面的にポリッシュ' },
    ],
  },

  // ===== v0.9.0 — 2026-05-15 : ブログ表側UIの磨き込み =====
  {
    version: 'v0.9.0', date: '2026-05-15', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: 'ブログ記事のテーブル UI を改善し、インラインスタイルの上書き・カラー変数の整理・デスクトップのフォントサイズを調整' },
    ],
  },
  {
    version: 'v0.9.0', date: '2026-05-15', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'ブログ一覧の ISR キャッシュ汚染バグを修正（取得失敗時に throw して空ページがキャッシュされるのを防止）' },
    ],
  },

  // ===== v0.10.0 — 2026-05-22 : /dev 技術ブログ・プラグイン群 =====
  {
    version: 'v0.10.0', date: '2026-05-22', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: '開発者向けの技術ブログ枠として /dev 配信ルートおよび tech-posts コレクションを追加' },
      { text: '記事スラッグ変更時の履歴保存と、旧スラッグからの 301 リダイレクトを自動化するプラグイン(slugTracker)を追加' },
      { text: 'リッチテキストをワンクリックで Markdown 形式に変換・コピーする機能をプラグイン(markdownCopy)としてカプセル化（posts / tech-posts に適用）' },
    ],
  },
  {
    version: 'v0.10.0', date: '2026-05-22', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: 'ブログ詳細ページのタイポグラフィを Airbnb Newsroom 基準（本文18pxなど）に刷新' },
      { text: 'プレビューページおよび静的ページ（規約やポリシー等）のテーマをブランドカラーのダーク Void に統合' },
    ],
  },
  {
    version: 'v0.10.0', date: '2026-05-22', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'モバイル版 Google Chrome および Safari でダブルタップズームが発生し UI が拡大してしまうズームバグを viewport meta で修正' },
    ],
  },

  // ===== v1.0.0 — 2026-05-30 : ライブプレビュー & 配信最適化（既存） =====
  {
    version: 'v1.0.0', date: '2026-05-30', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'ライブプレビュー画面でエディタとプレビューの境界をドラッグ＆ドロップでサイズ変更できるリサイズ機能を実装' },
      { text: 'html-files コレクションのライブプレビュー機能（アコーディオン切り替え、スティッキーヘッダー）を追加' },
      { text: 'カテゴリのトリム対応重複登録防止バリデーションを Categories コレクションに追加' },
      { text: '実績・問い合わせ時の「ご予算感」自動連動ロジックの実装' },
    ],
  },
  {
    version: 'v1.0.0', date: '2026-05-30', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'ブラウザ「戻る・進む」遷移時の画像消失バグを sessionStorage キャッシュで解消' },
      { text: 'GCS 画像の読み込み速度を直結 URL 参照とキャッシュ最適化により 0.1秒台に高速化' },
      { text: 'Next.js unstable_noStore 導入によるブログ詳細ページの画像更新タイムラグ（キャッシュ残り）の解消' },
      { text: 'Firebase App Hosting Google CDN のキャッシュ永久化バグを、Next.js の on-demand revalidate とプラットフォーム連動により解決' },
      { text: '管理画面の画像切り抜きツール（Image Cropper）が overflow: hidden により枠線ハンドルをクリップしていた表示崩れを修正' },
    ],
  },

  // ===== v1.0.1 — 2026-05-31 : OGP自動補完 & HTMLソースビューワー（既存） =====
  {
    version: 'v1.0.1', date: '2026-05-31', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: '記事のアイキャッチ画像から OGP 画像タグを自動生成・補完する ogImageAutoFillPlugin を導入' },
      { text: 'HTML ソースビューワーに Monaco Editor を導入し、HTMLHint による構文チェック機能を追加' },
      { text: 'フォントサイズ選択欄を Figma スタイルの直接入力フィールドに置き換え' },
    ],
  },
  {
    version: 'v1.0.1', date: '2026-05-31', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: 'Firebase App Hosting の環境変数管理（apphosting.yaml env 設定キーと Secret Manager の権限設定）を修正し、同期漏れを解決' },
    ],
  },

  // ===== v1.1.0 — 2026-06-03 : 構造化データ & 検索置換（既存） =====
  {
    version: 'v1.1.0', date: '2026-06-03', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'ブログ記事ページに構造化データ（Organization + BlogPosting JSON-LD）を自動挿入する機能を追加' },
      { text: 'リッチテキストエディタのテキストスタイルツールバーに「検索＆置換」機能を追加' },
    ],
  },
  {
    version: 'v1.1.0', date: '2026-06-03', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'TextStyleToolbar でフォントサイズを数字入力する際の入力挙動、および React/ESLint ルール違反を修正' },
      { text: '自動バックアップスクリプトにおける PSModulePath 関連の動作不具合を修正' },
    ],
  },

  // ===== v1.2.0 — 2026-06-14 : 認証（既存） =====
  {
    version: 'v1.2.0', date: '2026-06-14', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'Touch ID / Face ID などの生体認証を利用した WebAuthn / パスキーログイン機能を追加' },
      { text: 'パスワード認証に加えてパスキーを要求するセキュアな 2要素認証（2FA）ログインフローを実装' },
    ],
  },
  {
    version: 'v1.2.0', date: '2026-06-14', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'SEO 向上のため全フロントエンドページに canonical タグを自動付与。全ページの canonical が root に向くバグを解消' },
      { text: 'sitemap.xml の最終更新日時の精度向上、およびプレビュー用の動的ルートの noindex 設定を適用' },
    ],
  },

  // ===== v1.3.0 — 2026-06-15 （既存） =====
  {
    version: 'v1.3.0', date: '2026-06-15', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: '本番環境（noe-shiftica.com）におけるパスキー（WebAuthn）および 2FA ログインの動作安定性を検証・修正' },
      { text: 'Gemini API キー無効時に管理画面の UI 上に分かりやすいエラー警告（インライン警告）を表示するようハンドリング強化' },
      { text: 'Markdown ペースト時のコードブロック消失バグ、およびデフォルトコンバーターでインラインの文字色/サイズが消えるバグを修正' },
    ],
  },

  // ===== v1.4.0 — 2026-06-17 : HTMLホスティング（既存） =====
  {
    version: 'v1.4.0', date: '2026-06-17', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'HTML ホスティング機能（hosted-pages コレクション、/p/[slug] 配信ルート、プラグイン src/plugins/html-hosting/）を新規追加。管理画面の3分割コード編集および自動パースに対応' },
    ],
  },
  {
    version: 'v1.4.0', date: '2026-06-17', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: 'モバイル環境における管理画面のリッチテキスト編集領域の UX を調整し、入力スペースを最大化' },
    ],
  },
  {
    version: 'v1.4.0', date: '2026-06-17', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'pnpm payload migrate が出力ゼロで無限ハングする問題（確認プロンプトの stdin 待ち）を spawnSync の y 入力により回避' },
    ],
  },

  // ===== v1.5.0 — 2026-06-19 : CodeMirror 統一・リンクUI・Changelog/What's New（既存 + 統一強調） =====
  {
    version: 'v1.5.0', date: '2026-06-19', category: 'Changed' as const, status: 'published' as const,
    changes: [
      { text: '管理画面の全コードエディタ（HTML ソースビューワー、HTML ホスティング、JSON メタデータ）を CodeMirror 6（@uiw/react-codemirror）に統一。これまで混在していた Monaco / Prism / CodeMirror を一本化し、ライト／ダークテーマの自動追従と VS Code 風ダークテーマ、矢印キー操作の安定動作を実現' },
    ],
  },
  {
    version: 'v1.5.0', date: '2026-06-19', category: 'Added' as const, status: 'published' as const,
    changes: [
      { text: 'ブログ記事本文内のリンクに常時アンダーラインと右上の外部リンクマークを表示するスタイルを追加' },
      { text: 'リンクホバー時の専用ネオンライム色カスタムカーソル（.link-cursor）を実装' },
      { text: '更新情報を提示するための Changelog および What\'s New ページを追加' },
    ],
  },
  {
    version: 'v1.5.0', date: '2026-06-19', category: 'Fixed' as const, status: 'published' as const,
    changes: [
      { text: 'Monaco Editor が入力イベントを横取りし、矢印キー移動やコピペができなくなっていたバグを修正' },
      { text: 'サイドバー JSON 編集欄（customMetaData）の動的再計算暴走によるレイアウト崩壊を固定高さ（320px）化で解決' },
    ],
  },
]

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../src/payload.config')
  const payload = await getPayload({ config: configPromise })

  console.log('Purging existing changelog collection entries...')
  const existing = await payload.find({ collection: 'changelog', limit: 1000, overrideAccess: true })
  for (const doc of existing.docs) {
    await payload.delete({ collection: 'changelog', id: doc.id, overrideAccess: true })
    console.log(`- Deleted changelog entry: [${doc.date}] ${(doc as any).version} ${(doc as any).category} (ID: ${doc.id})`)
  }

  console.log(`\nStarting comprehensive import of ${changelogData.length} published entries...`)
  let count = 0
  for (const entry of changelogData) {
    try {
      const doc = await payload.create({ collection: 'changelog', data: entry, overrideAccess: true })
      console.log(`✓ [${doc.date}] ${(doc as any).version} ${(doc as any).category} (ID: ${doc.id})`)
      count++
    } catch (err) {
      console.error(`✗ Failed: ${entry.date} - ${entry.category}`, err)
    }
  }
  console.log(`\nDone. Imported ${count}/${changelogData.length} published entries.`)
  process.exit(0)
}

run().catch((err) => { console.error('Import process failed:', err); process.exit(1) })
