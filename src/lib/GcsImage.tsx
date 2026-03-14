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
    /** Show premium shimmer effect while loading */
    showShimmer?: boolean
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
    quality = 30,
    sizes,
    preOptimized = false,
    showShimmer = false,
}: GcsImageProps) {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    // Fix for SSG hydration race condition:
    // On SSG pages, the browser may finish loading the image BEFORE React hydrates
    // and attaches the onLoad handler. In that case, onLoad never fires and the
    // image stays invisible (opacity: 0 when showShimmer=true).
    // Checking img.complete on mount catches this case.
    React.useEffect(() => {
        const isComplete = imgRef.current?.complete;
        const naturalWidth = imgRef.current?.naturalWidth;
        if (isComplete && naturalWidth && naturalWidth > 0) {
            setIsLoaded(true);
        }
    }, [src]);

    // When browser restores the page from bfcache (back/forward navigation),
    // React state resets to false. This listener catches the persisted restore
    // and immediately marks the image as loaded so it doesn't flash invisible.
    React.useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) setIsLoaded(true);
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    if (!src) return null;

    // Fix for Firebase App Hosting loopback deadlocks:
    let finalSrc = src;
    const isLocalPayload = src.startsWith('/api/');
    
    // Safety check for process.env in client-side
    const env = (typeof process !== 'undefined' ? process.env : {}) as any;
    const isProduction = env.NODE_ENV === 'production';
    const isFirebase = !!env.FIREBASE_CONFIG;

    // Use direct GCS URL in production to bypass slow proxy
    if (isLocalPayload && (isProduction || isFirebase)) {
        const filename = src.replace('/api/media/file/', '');
        const bucket = env.NEXT_PUBLIC_GCS_BUCKET || 'noe-shiftica.firebasestorage.app';
        finalSrc = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filename)}?alt=media`;
    }

    // preOptimized=true: Payload pre-generated variant → skip /_next/image proxy → GCS CDN direct
    // isLocalPayload: /api/ paths on Firebase → skip to avoid loopback deadlock
    // IMPORTANT: For 0.1-0.2s speed, we use unoptimized={true} for all production images
    // because GCS already serves optimized variants if requested.
    const shouldDisableOptimization = preOptimized || (isLocalPayload && (isProduction || isFirebase));

    // Default sizes for common blog/app layouts
    const defaultSizes = priority
        ? "(max-width: 1024px) 33vw, 724px" // Hero images
        : "(max-width: 640px) 25vw, (max-width: 1024px) 25vw, 25vw"; // Card/Sidebar images

    const imageElement = (
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
            onLoad={() => {
                setIsLoaded(true);
            }}
            onError={() => {
                setIsLoaded(true); // Don't block UI if image fails
            }}
            style={{ 
                objectFit: 'cover', 
                objectPosition: 'center',
                opacity: isLoaded ? 1 : (showShimmer ? 0 : 1),
            }}
            className={`transition-all duration-700 ease-in-out ${className}`}
        />
    );

    if (showShimmer) {
        return (
            <div className={`relative w-full h-full skeleton`}>
                {!isLoaded && <div className="shimmer-overlay" />}
                {imageElement}
            </div>
        );
    }

    return imageElement;
}

export default GcsImage
