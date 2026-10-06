import React from 'react'
import type { SerializedUploadNode } from '@payloadcms/richtext-lexical'
import type { JSXConverters } from '@payloadcms/richtext-lexical/react'
import { ARTICLE_IMAGE_SIZES, buildImageSources, type MediaDoc } from './sources'
import styles from './articleImages.module.css'

/**
 * Replaces Payload's default `upload` JSX converter for article bodies.
 *
 * The default renders a <picture> with `(max-width: Npx)` sources in imageSizes order,
 * so desktop always downloaded the 1920px `large` variant, phones got a 480px one, and
 * nothing was lazy-loaded. This renders one <img> with a width-descriptor srcset + sizes
 * (the browser picks by rendered width × DPR), lazy-loads it, and links it to the
 * original in a new tab.
 */
export const articleImageConverters: JSXConverters<SerializedUploadNode> = {
    upload: ({ node }) => {
        // Unpopulated relation (depth 0) — nothing to render.
        if (typeof node.value !== 'object' || !node.value) return null
        const doc = node.value as MediaDoc

        if (!doc.mimeType?.startsWith('image')) {
            return doc.url ? (
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.filename}
                </a>
            ) : null
        }

        const sources = buildImageSources(doc)
        if (!sources) return null
        const alt = (node.fields?.alt as string | undefined) || doc.alt || ''

        return (
            <a
                href={sources.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                title="元画像を新しいタブで開く"
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- variants are pre-generated WebP served straight from GCS; no /_next/image hop */}
                <img
                    src={sources.src}
                    srcSet={sources.srcSet || undefined}
                    sizes={sources.srcSet ? ARTICLE_IMAGE_SIZES : undefined}
                    alt={alt}
                    width={sources.width}
                    height={sources.height}
                    loading="lazy"
                    decoding="async"
                />
            </a>
        )
    },
}
