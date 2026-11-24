import React from 'react'
import Script from 'next/script'
import { MD_ROOT_CLASS } from './scopeCss'

/**
 * Markdown 記事の本文コンテナ。サイト本物の本文の囲み（prose / postContent）の中に置かれる。
 *
 * HTML は renderMarkdownArticle() の結果をそのまま入れる（設計書 §4-4）。
 * コンテナ直下に本文の要素が並ぶ（md-ui.js が root.children を見るため）。
 * `data-md-root` は共通 JS が「ここが本文」と分かるための目印。
 *
 * 見た目の上書き（article.scoped.css）は記事ページ全体で読み込む（PostArticle）。
 * 共通 JS は描画が落ち着いてから（afterInteractive）読む。ハイドレーション前に DOM を
 * 書き換えると不一致になるため。
 */
export function MarkdownBody({ html }: { html: string }) {
  return (
    <>
      <div className={MD_ROOT_CLASS} data-md-root dangerouslySetInnerHTML={{ __html: html }} />
      <Script src="/md-assets/md/term-note.js" strategy="afterInteractive" />
      <Script src="/md-assets/md/md-ui.js" strategy="afterInteractive" />
    </>
  )
}
