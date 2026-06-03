# Lexical Search & Replace Plugin (SearchReplaceFeature)

A custom Lexical Editor Feature for the PayloadCMS v3 admin editor that adds
in-editor **find** and **replace** with live match highlighting.

## Features

- **Find** — type a query and every occurrence is highlighted live (a custom
  overlay layer; the editor selection is never touched, so the search box keeps
  focus while you type).
- **Navigate** — `Enter` / `Shift+Enter` (or the ▲▼ buttons) jump to the
  next / previous match and scroll it into view. The active match is shown in
  the accent colour, the rest dimmed.
- **Replace / Replace All** — replace the current match or every match.
- **Case sensitivity toggle** (`Aa`).
- **Shortcut** — `Cmd/Ctrl+H` toggles the panel. `Esc` closes it.
- **Match counter** — `current / total`.

## Behaviour & constraints

- Matches are computed **per single `TextNode`**. A query that spans multiple
  adjacent text nodes (e.g. across a bold boundary) is intentionally not
  matched — this keeps offsets unambiguous and replacement safe.
- Highlighting uses an **overlay layer** (absolutely-positioned divs measured
  via `Range.getClientRects()`), not the Lexical selection. This avoids stealing
  focus from the search input on every keystroke. The overlay re-measures on
  editor edits, scroll, and resize.
- `Replace` uses a real `RangeSelection` + `insertText`; `Replace All` rewrites
  each affected node's text content via regex. Both are undo-able.

## Technical stack

- **Core Engine**: React.js & Lexical (core imports from `lexical`).
- **Selection / nodes**: `$getRoot`, `$getNodeByKey`, `$createRangeSelection`,
  `$setSelection`, `$isTextNode`, `$isElementNode`.
- **Styling**: inline styles + a single injected `<style data-searchreplace-toolbar>`
  tag, matching the Payload dark theme via `var(--theme-*)` tokens.
- **Icons**: `lucide-react`.

## Setup & Registration

The feature is registered the same way as `TextStyleFeature`. Because Payload's
`generate:importmap` does NOT execute custom server features via pure static AST
analysis, the client feature must be registered in **four** places:

### 1. `src/payload.config.ts`

```typescript
import { SearchReplaceFeature } from './plugins/searchReplace/feature.server'

// (a) main editor features list
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    SearchReplaceFeature(),
    // ...
  ],
})

// (b) static-analysis dummy so the compiler catches the client feature path
const _dummyForStaticAnalysis = lexicalEditor({
  features: [SearchReplaceFeature()],
})

// (c) importMap generator
generators: [({ addToImportMap }) => {
  addToImportMap('@/plugins/searchReplace/feature.client#SearchReplaceFeatureClient')
}]
```

### 2. `src/plugins/markdownCopyPlugin/index.ts`

`markdownCopyPlugin` overrides the `content` rich-text editor for the `posts` and
`tech-posts` collections, so `SearchReplaceFeature()` must be duplicated inside
its `lexicalEditor({ features })` list, or it will be silently dropped for those
collections.

### 3. `src/app/(payload)/admin/importMap.js`

Entry (MD5 of `@/plugins/searchReplace/feature.client` =
`de05113d1fcf9d742cf37efd80619c10`):

```javascript
import { SearchReplaceFeatureClient as SearchReplaceFeatureClient_de05113d1fcf9d742cf37efd80619c10 } from '@/plugins/searchReplace/feature.client'
// ...
"@/plugins/searchReplace/feature.client#SearchReplaceFeatureClient": SearchReplaceFeatureClient_de05113d1fcf9d742cf37efd80619c10,
```

## Files

- `feature.server.ts` — `createServerFeature` registration.
- `feature.client.tsx` — `createClientFeature`; registers the button on the
  **fixed** toolbar only (single mount → single `Cmd/Ctrl+H` listener).
- `components/SearchReplaceToolbar.tsx` — the toolbar item, panel UI, matching,
  navigation, replace logic, and overlay highlighting.
