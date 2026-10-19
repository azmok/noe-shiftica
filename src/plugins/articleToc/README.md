# Article TOC Plugin

記事の目次と見出しリンク（アンカー）を出すフロント側のプラグイン。General / Dev の記事ページ（`PostArticle.tsx`）で使う。Payload の設定には登録しない。

## 構成
- `headings.ts`：本文（Lexical）から見出しを取り出し、URL に使う ID（日本語のまま読める形）を振る。`extractHeadings()` / `slugifyHeading()`
- `ArticleToc.tsx`：本文上部の折りたたみ目次。`tocEntries()` で h2 / h3 を選ぶ（2件未満なら出さない）
- `ArticleTocSidebar.tsx`：デスクトップの右サイドの目次。今読んでいる見出しをハイライトする
- `headingConverter.tsx`：見出しに `id` / `data-heading-id` とリンクアイコンを付ける JSX converter（`headingWithAnchor()`）
- `HeadingAnchorBehavior.tsx`：本文はモバイル用とデスクトップ用の2回描画されるので、見出しクリック・`#リンク`・URL の hash を、いま見えている側の見出しへスクロールさせる
- `ArticleToc.module.css`：見出しのスクロール位置とリンクアイコンの見た目

## 使い方
```tsx
const { headings, idByNode } = extractHeadings(post.content)
const toc = tocEntries(headings)
// converters に heading: headingWithAnchor(idByNode, withIds) を入れる
<HeadingAnchorBehavior scopeId={scopeId} />
<ArticleToc entries={toc} />
<ArticleTocSidebar entries={toc} scopeId={scopeId} />
```
