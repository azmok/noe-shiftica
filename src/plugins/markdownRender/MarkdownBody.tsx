import React from 'react'
import Script from 'next/script'
import { MD_ROOT_CLASS } from './scopeCss'

/**
 * Markdown 記事の本文コンテナ。
 *
 * HTML は renderMarkdownArticle() の結果をそのまま入れる（設計書 §4-4）。
 * コンテナ直下に本文の要素が並ぶ（md-ui.js が root.children を見るため）。
 * `data-md-root` は共通 JS が「ここが本文」と分かるための目印。
 *
 * 共通 CSS は build-md-assets.ts が作る `ini.md.scoped.css`（`@scope (.md-render)` 済み）を
 * <link> で読む。サーバーでもブラウザ（Live Preview）でも同じ書き方で動く。
 * 共通 JS は描画が落ち着いてから（afterInteractive）読む。ハイドレーション前に DOM を
 * 書き換えると不一致になるため。
 */
export function MarkdownBody({ html }: { html: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags -- 記事ごとに読む共通CSS。React 19 の precedence で head に集約される */}
      <link rel="stylesheet" href="/md-assets/md/ini.md.scoped.css" precedence="md-render" />
      <div className={MD_ROOT_CLASS} data-md-root dangerouslySetInnerHTML={{ __html: html }} />
      <Script src="/md-assets/md/term-note.js" strategy="afterInteractive" />
      <Script src="/md-assets/md/md-ui.js" strategy="afterInteractive" />
    </>
  )
}
