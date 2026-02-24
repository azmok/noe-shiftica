# Noe Shiftica Webサイト構築 実装計画書

提供されたドキュメント(ブランド・コンセプトシート、LP構成案)とスキル(firecrawlでの他サイト分析、ui-ux-pro-maxのUI/UX原則)に基づき、受賞歴のあるような高品質なデザイン・体験を持つWebサイトを構築します。

## ユーザー確認事項
> [!IMPORTANT]
> 1. **プロジェクト初期化**: フォルダ内が現在空の状態に近いと見受けられるため、`create-next-app` 等を用いてNext.jsの新規プロジェクトを構築します。よろしいでしょうか？
> 2. **DB環境の用意**: `Payload CMS` および `Neon (Postgres)` のローカル開発用・本番用の環境変数 (APIキー、DB接続URL等) の準備をお願いすることになります。または、まずはローカルのSQLite等で進めるかご希望に合わせて調整可能です。
> 3. **ロゴの使用**: 白・黒のロゴを提供いただきましたが、基本となるサイトデザインが「Void Dark (#0C0418)」背景のため、主に白ロゴを使用する想定です。黒ロゴは専用のライトなセクションで活用します。

## 提案される変更点 / 構築ステップ

---

### プロジェクトセットアップ (Next.js + Payload CMS)
- Next.js App Router (TypeScript, Tailwind CSS) ベースの新規プロジェクト構築
- Payload CMS 3.x をプロジェクトへ統合
- ブログ (Blog) と お問い合わせ (Contacts) 用のコレクション定義、Neon PostgreSQLへの接続

### グローバルデザイン・スタイリング (ui-ux-pro-max準拠)
`ui-ux-pro-max` のガイドラインを適用し、プロフェッショナルなデザインシステムを組み込みます。
- **カラーパレット (Palette B: Life and Depth)**
  - Background (Void Dark): `#0C0418` / Neutral (Plum Carbon): `#2A1040`
  - Primary (Acid Lime): `#CCDD00` / Glow: `#E8FF6A`
  - Secondary (Deep Violet): `#6B2DA0` / Accent: `#A060D0`
- **タイポグラフィ (Swiss Grotesk 系 × 和文)**
  - 日本語：Noto Serif JP, 游明朝 (見出し) / Noto Sans JP (本文)
  - 英語：PP Neue Montreal (代替としてGoogle Fontsの Inter や Space Grotesk などを適用)
- **UX/UI 改善**
  - カスタムカーソルによるブランド独自性の演出
  - アクセシビリティ考慮（コントラスト比4.5:1、aria-label付与、プレースホルダー等）

### Three.js アニメーション実装
- `react-three-fiber` とスプライト・パーティクルを用いたAcid Lime発光アニメーション
- 背景 (Void Dark) に対して、sin/cosベースの緩やかな浮遊を実装
- ロゴおよびマウスカーソルに向かってパーティクルが引き寄せられる(Attraction) インタラクション

### ページとコンポーネント (Frontend)
主にFramer Motion または GSAPを用いたスクロール・パララックス実装を行います。
- **LP (/)**: 5セクション構成
  - Hero (英大見出し + 日本語サブ + CTA)
  - Concept (AI×最新技術の3つの柱)
  - How it Works (制作の5ステップ)
  - Pricing (3プランと保守費用)
  - Contact (フォーム)
- **About (/about)**: 哲学・スタンス・Tech Stackを伝える内省的なデザイン
- **Blog (/blog)**: Payload CMS連動のブログ一覧・詳細ページ

## 検証計画

### 開発・単体テスト
- `npm run dev` でNext.jsローカルサーバーを起動し、ビルドエラーがないか確認
- Payload CMS (`/admin`) が正常に起動し、初期ユーザー登録が完了するかテスト

### デザイン検証・UXテスト (手動・目視)
- デスクトップ・モバイル (375px/1024px) 両方でのレスポンシブデザイン確認
- スクロール時のパララックスやThree.jsのパフォーマンス低下(FPSドロップ)がないかをブラウザのDevToolsで検証
- 文字色と背景色のコントラストを目視確認し、ui-ux-pro-max基準を満たしているかチェック

### 連携テスト
- お問い合わせフォームからデータ送信後、Payload CMSの Contacts コレクションに保存されているか確認
- ダミーのブログ投稿を行い、`/blog` ページに正確に描画されるか確認
