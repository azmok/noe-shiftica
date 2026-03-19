# LCP Performance Optimization (Mobile)

## 実装パターン

PSI モバイル LCP が異常値（108.6s）を示した際の診断・修正パターン。原因は単一ではなく多層構造になることが多い。

---

### 1. framer-motion の LCP 要素を即時表示にする

**問題**: `initial="hidden"` で `opacity: 0` スタートにすると、JS ロード → hydration → アニメーション完了まで LCP がカウントされ続ける。

**修正**: above-the-fold の LCP 要素（h1 等）には `initial={false}` を使う。

```tsx
// ❌ NG: opacity:0 でスタートするため LCP が JS 完了まで遅延
<motion.h1 initial="hidden" animate="visible" variants={fadeIn}>

// ✅ OK: 即時 animate 値で表示、JS 完了を待たない
<motion.h1 initial={false} animate="visible" variants={fadeIn}>
```

`initial={false}` の意味: framer-motion に「このコンポーネントはSSR済みとして扱え、初期アニメーションをスキップして animate 値を即反映せよ」と指示する。

---

### 2. 重い WebGL / Three.js コンポーネントを遅延ロード

**問題**: Three.js（~600KB）が初期 JS バンドルに含まれると、モバイルでのパース・実行がボトルネックになり LCP が遅延する。

**修正**: `next/dynamic` で遅延ロード、`ssr: false` で SSR から除外。

```tsx
// ❌ NG: Three.js が初期バンドルに含まれる
import { PastelTopology } from "./PastelTopology";

// ✅ OK: 初期バンドルから除外、hydration 後に非同期ロード
import dynamic from "next/dynamic";

const PastelTopology = dynamic(
  () => import("./PastelTopology").then((m) => ({ default: m.PastelTopology })),
  { ssr: false, loading: () => null }
);
```

named export のコンポーネントは `.then((m) => ({ default: m.ComponentName }))` で default export に変換する必要がある。

---

### 3. TypeKit (Adobe Fonts) を render-blocking から外す

**問題**: `<head>` 内の `<script>` でTypeKit を読み込むと render-blocking になる。

**修正**: `next/script` の `strategy="afterInteractive"` で body 末尾に移動。

```tsx
// ❌ NG: <head> 内の <script> → render-blocking
<head>
  <script dangerouslySetInnerHTML={{ __html: `...typekit code...` }} />
</head>

// ✅ OK: <body> 末尾で afterInteractive → render-blocking 解消
<Script
  id="typekit"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{ __html: `...typekit code...` }}
/>
```

**トレードオフ**: Adobe Fonts の読み込みがページ表示後になるため、一瞬フォールバックフォントが見える（FOUT）。LCP 100秒超との比較では許容範囲。

---

### 4. Google Fonts 直接リンクを next/font に移行

**問題**: `<link href="https://fonts.googleapis.com/...">` は外部スタイルシートとして render-blocking になる。

**修正**: `next/font/google` に移行してセルフホスト化。

```tsx
// ❌ NG: 外部スタイルシート → render-blocking
<link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@200..800&display=swap" rel="stylesheet" />

// ✅ OK: next/font でセルフホスト化 → render-blocking なし
import { Oxanium } from "next/font/google";

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});
```

**⚠️ 重要**: next/font はフォントファミリー名を `__FontName_hash` にリネームする。
CSS で `font-family: "Oxanium"` と直接書いていた箇所は **必ず** `font-family: var(--font-oxanium)` に変更すること。変更しないとフォントが当たらない。

---

### 5. Three.js IcosahedronGeometry のポリゴン数削減

**問題**: `IcosahedronGeometry(2, 40)` は細分割数 40 = 超高ポリゴン。モバイル GPU で処理が重くメインスレッドも圧迫する。

**修正**: 細分割数を 20 に削減。視覚的な差はほぼなく GPU 負荷は大幅減。

```tsx
// ❌ NG
const geometry = new THREE.IcosahedronGeometry(2, 40);

// ✅ OK
const geometry = new THREE.IcosahedronGeometry(2, 20);
```

---

## 使用ファイル

- `src/app/(frontend)/layout.tsx`
- `src/app/(frontend)/styles.css`
- `src/app/(frontend)/components/HeroSection.tsx`
- `src/app/(frontend)/components/PastelTopology.tsx`

## 処理フロー（診断手順）

1. PSI で LCP 異常値を検知
2. ヒーローセクション関連コンポーネントを確認
3. `initial="hidden"` などの opacity:0 スタート要素を特定
4. render-blocking リソース（`<head>` の `<script>`, `<link rel="stylesheet">`）を特定
5. 初期バンドルに含まれる重いライブラリ（Three.js 等）を特定
6. 上記パターンで順次修正

## ハマりポイント

- **framer-motion の initial="hidden" は LCP キラー**: above-the-fold の要素には絶対に使わない。`initial={false}` が正解。
- **next/font 移行後は CSS の font-family 参照も更新必須**: `"FontName"` → `var(--font-variable)` への変更を忘れると無音でフォントが消える。
- **next/dynamic の named export 対応**: `() => import("./Foo").then(m => ({ default: m.Foo }))` パターンを使う。
- **TypeKit の FOUT は許容トレードオフ**: render-blocking 解消の副作用として発生するが、LCP 改善の優先度が上。
