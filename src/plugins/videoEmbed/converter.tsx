import React from 'react'
import type { JSXConverter } from '@payloadcms/richtext-lexical/react'
import styles from './VideoEmbed.module.css'

/**
 * 記事本文の動画（Lexical の upload ノードで mimeType が video/*）を、
 * リンクではなくインラインの <video> プレイヤーで描画する。
 * 動画以外のアップロードは元の converter にそのまま任せる。
 */

interface UploadValue {
  url?: string | null
  mimeType?: string | null
  alt?: string | null
  filename?: string | null
}

/** 再生に使う動画 URL。動画以外・未展開（ID のまま）なら null */
export function videoUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const { url, mimeType } = value as UploadValue
  if (typeof url !== 'string' || !url) return null
  if (typeof mimeType !== 'string' || !mimeType.startsWith('video/')) return null
  return url
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UploadConverter = JSXConverter<any>

/** 既存の upload converter を受け取り、動画ノードだけ <video> に差し替えた converter を返す */
export function withVideoEmbed(base: UploadConverter | undefined): UploadConverter {
  return function VideoEmbed(args) {
    const url = videoUrl(args.node?.value)
    if (!url) return typeof base === 'function' ? base(args) : base

    const { mimeType, alt, filename } = args.node.value as UploadValue
    const label = alt || filename || '動画'
    return (
      <figure className={styles.figure}>
        {/*
          preload=metadata: 再生ボタンを押すまで本体は読まない（ページ表示を重くしない）。
          #t=0.001: iOS Safari でも先頭フレームをポスター代わりに出す。
          Range リクエストは Firebase Storage 側が処理するので、シークもストリーミングで動く。
        */}
        <video className={styles.video} controls playsInline preload="metadata" aria-label={label}>
          <source src={`${url}#t=0.001`} type={mimeType ?? undefined} />
          <a href={url}>{label}をダウンロード</a>
        </video>
      </figure>
    )
  }
}
