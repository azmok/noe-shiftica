# JSON-LD Implementation Pattern (Recommended by Next.js)

Next.js (App Router) における構造化データ (JSON-LD) の推奨される実装パターンについての記録。

## 概要

Next.js では、構造化データを `<head>` ではなく、Server Component の `return` 内（`<body>` セクション）に直接インポートすることが推奨される。これにより、初期 HTML に確実に含まれ、かつクライアントサイドでの二重管理や複雑な注入処理を避けることができる。

## 実装パターン

### 1. JSON-LD コンポーネントの作成
`next/script` を使用し、`application/ld+json` 形式でデータを注入する Server Component を作成する。

```tsx
// src/app/(frontend)/components/JsonLd.tsx
import Script from 'next/script'

export function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    // ...データ内容
  }

  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

### 2. レイアウトまたはページでの使用
`layout.tsx` の `<body>` 内で呼び出す。

```tsx
// src/app/(frontend)/layout.tsx
import { JsonLd } from "./components/JsonLd";

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <JsonLd />
        {children}
      </body>
    </html>
  )
}
```

## 使用ファイル
- `src/app/(frontend)/components/JsonLd.tsx`
- `src/app/(frontend)/layout.tsx`

## ハマりポイント
- **Metadata API との混用**: `layout.tsx` の `export const metadata = { other: ... }` で JSON-LD を入れることも可能だが、複雑な `@graph` 構造や動的な値を持たせる場合は、コンポーネントとして `next/script` を使う方が可読性と柔軟性が高い。
- **配置場所**: かつては `<head>` 内が定石だったが、Next.js (React) では `<body>` 内にスクリプトを記述しても検索エンジン（Google）は正しくパースする。むしろ Server Component の `return` に含めることで、ストリーミングや SSR との相性が良くなる。
- **サニタイズ**: `dangerouslySetInnerHTML` を使う際は、XSS対策として必要に応じて文字列の不完全なエスケープ（`<` が `\u003c` など）を考慮すること（`JSON.stringify` だけでも多くの場合十分だが、厳密な要件では注意）。
