# Google Analytics (GA4) Integration

### Implementation Pattern
Next.js (App Router) での Google Analytics (GA4) の導入パターン。`next/script` を使用したクライアントサイド・コンポーネントを作成し、ルートレイアウトに挿入する。

### 使用ファイル
- `src/app/(frontend)/components/GoogleAnalytics.tsx` (新規作成)
- `src/app/(frontend)/layout.tsx` (埋め込み)
- `.env.local` (環境変数)
- `apphosting.yaml` (Firebase App Hosting 環境設定)

### 処理フロー
1. `GoogleAnalytics` コンポーネントを作成し、`NEXT_PUBLIC_GA_MEASUREMENT_ID` を読み込んで `gtag` スクリプトを出力する。
2. ルートレイアウト (`layout.tsx`) の `<body>` タグ直下にコンポーネントを配置する。
3. `afterInteractive` ストラテジーを使用して、メインコンテンツのロードを妨げないようにする。
4. `apphosting.yaml` で環境変数を定義し、デプロイ時に値が反映されるようにする。

### ハマりポイント
- **インポートミス**: コンポーネントを `export default` している場合、レイアウト側でのインポートは `{ GoogleAnalytics }` ではなく `GoogleAnalytics` (名前なしインポート) にする必要がある。
- **環境変数のプレフィックス**: クライアントサイドで読み込むため、必ず `NEXT_PUBLIC_` プレフィックスを付ける必要がある。
- **シークレット管理**: GA ID は機密情報ではないため、`apphosting.yaml` に直接 `value` として記載して問題ないが、`.env.local` にも忘れずに記載すること。
