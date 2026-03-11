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
    /** Quality 1-100 (default: 90) */
    quality?: number
    /** Custom sizes attribute for fine-grained control */
    sizes?: string
}

/**
 * Premium shimmer effect for loading states
 */
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f1f5f9" offset="20%" />
      <stop stop-color="#e2e8f0" offset="50%" />
      <stop stop-color="#f1f5f9" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f1f5f9" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str: string) =>
    typeof window === 'undefined'
        ? Buffer.from(str).toString('base64')
        : window.btoa(str)

/**
 * Full-fill image that behaves like background-image: cover.
 * Parent element MUST have position: relative and a defined size.
 */
export function GcsImage({
    src,
    alt,
    priority = false,
    className = '',
    quality = 90,
    sizes,
}: GcsImageProps) {
    if (!src) return null;

    // Fix for Firebase App Hosting loopback deadlocks:
    const isLocalPayload = src.startsWith('/api/');
    const isProduction = process.env.NODE_ENV === 'production';
    const isFirebase = !!process.env.FIREBASE_CONFIG;

    const shouldDisableOptimization = isLocalPayload && (isProduction || isFirebase);

    // Default sizes for common blog/app layouts
    const defaultSizes = priority
        ? "(max-width: 1024px) 100vw, 1200px" // Hero images
        : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"; // Card/Sidebar images

    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes || defaultSizes}
            quality={quality}
            priority={priority}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
            unoptimized={shouldDisableOptimization}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            className={`transition-all duration-700 ease-in-out ${className}`}
        // fetchPriority is part of standard Next.js Image through the priority prop, 
        // but for modern browsers we can ensure the underlying img gets it
        />
    )
}

export default GcsImage
