/**
 * GcsImage
 *
 * Drop-in wrapper around Next.js <Image> for images served from
 * Google Cloud Storage (Firebase Storage). Provides:
 *  - Automatic WebP/AVIF conversion via Next.js image optimization
 *  - Lazy loading by default (set priority=true for LCP images)
 *  - Fill mode for containers sized by CSS (like background-image divs)
 *  - Smooth hover scale animation via CSS class
 */

import Image from 'next/image'
import React from 'react'

interface GcsImageProps {
    /** Full GCS/Firebase Storage URL */
    src: string
    /** Alt text (required for accessibility) */
    alt: string
    /**
     * Set true for above-the-fold / LCP images (featured post hero).
     * Disables lazy loading and adds fetchPriority="high".
     */
    priority?: boolean
    /** Extra Tailwind/CSS classes applied to the wrapping div */
    className?: string
    /** Quality 1-100 (default: 85) */
    quality?: number
}

/**
 * Full-fill image that behaves like background-image: cover.
 * Parent element MUST have position: relative and a defined size.
 */
export function GcsImage({
    src,
    alt,
    priority = false,
    className = '',
    quality = 85,
}: GcsImageProps) {
    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={quality}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            className={`transition-transform duration-700 ${className}`}
        />
    )
}

export default GcsImage
