import React from 'react'
import type { JSXConverter } from '@payloadcms/richtext-lexical/react'
import styles from './OriginalImageLink.module.css'

/**
 * 記事本文の画像（Lexical の upload ノード）を、原寸画像へのリンクで包む。
 * クリックすると Firebase Storage のオリジナル（Media の url）を新しいタブで開く。
 * 表示そのもの（<picture> とサイズ違いの <source>）は元の converter に任せる。
 */

interface UploadValue {
  url?: string | null
  mimeType?: string | null
  alt?: string | null
  filename?: string | null
}

/** リンク先にする原寸画像の URL。画像以外・未展開（ID のまま）なら null */
export function originalImageUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const { url, mimeType } = value as UploadValue
  if (typeof url !== 'string' || !url) return null
  if (typeof mimeType !== 'string' || !mimeType.startsWith('image')) return null
  return url
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UploadConverter = JSXConverter<any>

/** 既存の upload converter を受け取り、原寸リンク付きの converter を返す */
export function withOriginalImageLink(base: UploadConverter | undefined): UploadConverter {
  return function OriginalImageLink(args) {
    const rendered = typeof base === 'function' ? base(args) : base
    const url = originalImageUrl(args.node?.value)
    if (!url || rendered === null || rendered === undefined) return rendered

    const { alt, filename } = args.node.value as UploadValue
    const label = alt || filename || '画像'
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        aria-label={`${label}（原寸画像を新しいタブで開く）`}
      >
        {rendered}
      </a>
    )
  }
}
