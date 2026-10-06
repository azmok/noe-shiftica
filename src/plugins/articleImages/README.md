# articleImages plugin

Renders Media uploads embedded in article bodies (Lexical `upload` nodes) for the
public blog / dev article pages (`PostArticle`).

## What it does

- **Responsive size per device** — a single `<img>` with a width-descriptor `srcset`
  built from the pre-generated WebP variants (`thumbnail` 400 / `medium` 800 /
  `large` 1920) plus the original, and a `sizes` that matches the article column
  (`ARTICLE_IMAGE_SIZES`). The browser picks the smallest file covering
  rendered width × DPR (phone ≈ 400–1200px, desktop ≈ 800–1920px).
- **Lazy loading** — `loading="lazy"` + `decoding="async"`.
- **Click to open the original** — wrapped in `<a target="_blank" rel="noopener noreferrer">`
  pointing at the stored original (Firebase Storage direct URL).
  Note: the "original" is what the admin uploaded *after* ImageCompressionProvider
  (WebP q0.9, long edge ≤ 3840px).
- Non-image uploads render as a plain link (same as Payload's default).

Variants are served straight from GCS — no `/_next/image` processing, no server cost.

## Why

Payload's default `UploadJSXConverter` emits `<picture>` with `(max-width: Npx)` sources
in imageSizes order: desktop always got the 1920px variant, phones a 480px one
regardless of DPR, `thumbnail` / `og` were unreachable, and nothing was lazy-loaded.

## Registration

`src/app/(frontend)/blog/[slug]/PostArticle.tsx`:

```tsx
import { articleImageConverters } from "@/plugins/articleImages"

const customConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...articleImageConverters,
    // ...
})
```

If `Media.ts` imageSizes change, update `SRCSET_SIZE_NAMES` in `sources.ts`; if the
article column width changes, update `ARTICLE_IMAGE_SIZES`.

## Tests

`pnpm vitest run src/plugins/articleImages`
