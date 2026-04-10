# Noe Shiftica

> **Design the Shift.** 本質を設計する。世界観を転換する。

AIとデザインの力でビジネスの新たな次元を切り拓く、Noe Shifticaの公式ウェブ及びプラットフォームです。
最新のフロントエンド技術（Next.js, Three.js）による没入感のあるユーザー体験と、堅牢なバックエンド（Payload CMS, PostgreSQL）によるシームレスなコンテンツ管理を統合しています。

## ✨ 特徴 (Features)
- **Immersive 3D Background**: Three.js と React Three Fiber を用いたダイナミックなパーティクル・アニメーション
- **Smooth Animations**: Framer Motion によるスクロールに応じたシームレスな要素のフェードイン体験
- **Modern Typography**: "PP Neue Montreal", "Space Grotesk", "Noto Serif JP" 等を用いた洗練されたタイポグラフィ
- **Advanced Theming**: Acid Lime (`#CCDD00`) をアクセントカラーとし、完全な黒基調と白テキストによるハイコントラストなデザイン
- **Headless CMS Integration**: Payload CMS (v3) によって、ブログ（Posts / Categories）等の高度なコンテンツ管理機能を内部統合

## 🛠 テクノロジースタック (Technology Stack)
- **Framework**: Next.js (App Router)
- **Headless CMS**: Payload CMS 3
- **Database**: PostgreSQL (Docker経由)
- **Styling**: Tailwind CSS v4, Vanilla CSS Variables
- **3D & Animation**: Three.js, React Three Fiber, Framer Motion
- **Language**: TypeScript

## 🚀 開発環境のセットアップ (Getting Started)

### 1. リポジトリのクローン
```bash
git clone https://github.com/azmok/Noe_Shiftica.git
cd NS_v3.1
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
プロジェクトルートに `.env` ファイルを作成し、以下の設定を行ってください。
```env
DATABASE_URL=postgres://azuma:mysecretpassword@127.0.0.1:5432/myblogdb
PAYLOAD_SECRET=YOUR_SECRET_KEY
```

### 4. データベースの起動
Payload CMSはPostgreSQLと接続します。提供されている `docker-compose.yml` を使用してコンテナを起動してください。
```bash
docker-compose up -d
```
*(※既にホスト側の 5432 ポートが別のpostgresで使われている場合は適宜停止・再構築してください)*

### 5. 開発サーバーの起動
```bash
npm run dev
```
- **フロントエンド:** [http://localhost:3000](http://localhost:3000) にアクセスしてサイトを確認します。
- **管理画面 (CMS):** [http://localhost:3000/admin](http://localhost:3000/admin) にアクセスし、初回は初期ユーザー（Admin）を作成してから利用します（PostsやCategoriesの管理が可能です）。

## 📁 主要なディレクトリ構成 (Project Structure)
- `src/app/(frontend)`: ユーザー向けフロントエンドページ、レイアウト、スタイルの一元管理
- `src/app/(payload)`: Payload CMS の管理画面用エンドポイント
- `src/components`: ヘッダー、フッター、ボタン、Three.jsなどの再利用可能なUIコンポーネント
- `src/collections`: Payload CMSのデータベーススキーマ（Users, Media, Posts, Categories 等）

## 📜 ライセンス (License)
This project is specifically built for Noe Shiftica. All rights reserved.

