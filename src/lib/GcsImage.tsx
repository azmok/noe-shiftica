'use client'

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
    /** Quality 1-100 (default: 75) */
    quality?: number
    /** Custom sizes attribute for fine-grained control */
    sizes?: string
    /**
     * Set true when src is a Payload pre-generated variant (thumbnail/medium/large).
     * Bypasses the /_next/image proxy and serves directly from GCS CDN:
     *   default: GCS → Next.js server → browser (2 hops, slow on cold cache)
     *   preOptimized: GCS CDN → browser (1 hop, always fast)
     */
    preOptimized?: boolean
    /**
     * CSS object-fit value for the image (default: 'cover').
     * Use 'contain' to show the full image without cropping.
     */
    objectFit?: 'cover' | 'contain'
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
 * In-memory cache: fast lookup for SPA navigation within the same JS context.
 */
const memoryLoadedUrls = new Set<string>();

/**
 * sessionStorage-backed cache: survives force-dynamic page reloads on back/forward.
 * force-dynamic sets Cache-Control: no-store, preventing BFCache. On reload the JS
 * module re-initializes, so we must persist known-loaded URLs in sessionStorage.
 */
const SESSION_KEY = 'gcs_loaded_urls';

function isUrlCached(url: string): boolean {
    if (typeof window === 'undefined') return false;
    if (memoryLoadedUrls.has(url)) return true;
    try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (!stored) return false;
        const arr: string[] = JSON.parse(stored);
        return arr.includes(url);
    } catch {
        return false;
    }
}

function markUrlAsLoaded(url: string): void {
    memoryLoadedUrls.add(url);
    if (typeof window === 'undefined') return;
    try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        const arr: string[] = stored ? JSON.parse(stored) : [];
        if (!arr.includes(url)) {
            arr.push(url);
            // Cap at 200 entries to avoid storage bloat
            const trimmed = arr.length > 200 ? arr.slice(-200) : arr;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(trimmed));
        }
    } catch {
        // sessionStorage may be unavailable (private mode, quota exceeded)
    }
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
    quality = 75,
    sizes,
    preOptimized = false,
    objectFit = 'cover',
}: GcsImageProps) {
    // Determine the environment once, consistently. Use public env vars for client-side visibility.
    const isProduction = process.env.NODE_ENV === 'production';
    const isFirebase = !!process.env.NEXT_PUBLIC_GCS_BUCKET;

    // Calculate finalSrc FIRST (before hooks) so the cache key is consistent with markUrlAsLoaded
    let finalSrc = src;
    const isLocalPayload = src?.startsWith('/api/');

    if (isLocalPayload && (isProduction || isFirebase)) {
        try {
            const filename = src?.replace('/api/media/file/', '') || '';
            if (filename) {
                const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET || 'noe-shiftica.firebasestorage.app';
                finalSrc = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filename)}?alt=media`;
            }
        } catch (e) {
            console.error(`[DEBUG ERROR] GcsImage filename extraction failed for src: ${src}`, e);
        }
    }

    // Use finalSrc (not src) as the cache key — consistent with markUrlAsLoaded calls
    const isInitCached = React.useMemo(() => isUrlCached(finalSrc), [finalSrc]);
    const [isLoaded, setIsLoaded] = React.useState(isInitCached);

    // Ref to the underlying <img> element for browser-cached image detection
    const imgRef = React.useRef<HTMLImageElement>(null);

    // Mark URL as loaded on mount if already in cache (for SPA navigation tracking)
    React.useEffect(() => {
        if (finalSrc && isInitCached) {
            markUrlAsLoaded(finalSrc);
            setIsLoaded(true);
        }
    }, [finalSrc, isInitCached]);

    // Fallback for browser HTTP-cached images:
    // When the browser already has the image cached, the native `load` event fires
    // synchronously during DOM insertion — before React attaches the onLoad handler.
    // Result: onLoad never fires → isLoaded stays false → image permanently invisible.
    // Fix: check img.complete after mount and force isLoaded=true if already done.
    React.useEffect(() => {
        if (imgRef.current?.complete && !isLoaded) {
            setIsLoaded(true);
            markUrlAsLoaded(finalSrc);
        }
    // Intentionally empty deps: run once on mount only.
    // finalSrc and isLoaded are intentionally captured at mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!src) return null;

    // IMPORTANT: For 0.5s speed, serve preOptimized variants (medium/large/thumbnail)
    // directly from GCS CDN (1 hop) instead of routing through Next.js image proxy (2 hops).
    const shouldDisableOptimization = preOptimized;

    // Default sizes for common blog/app layouts
    const defaultSizes = priority
        ? "(max-width: 640px) 100vw, (max-width: 1200px) 100vw, 1200px" // Hero images
        : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"; // Grid/Card images

    return (
        <Image
            ref={imgRef}
            src={finalSrc}
            alt={alt}
            fill
            sizes={sizes || defaultSizes}
            quality={quality}
            priority={priority}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
            unoptimized={shouldDisableOptimization}
            {...(priority ? { fetchPriority: 'high' } : {})}
            onLoad={() => {
                setIsLoaded(true);
                markUrlAsLoaded(finalSrc);
            }}
            style={{
                objectFit: objectFit,
                objectPosition: 'center',
                transition: 'opacity 0.4s ease-out',
                opacity: isLoaded ? 1 : 0,
            }}
            className={className}
        />
    );
}

export default GcsImage
