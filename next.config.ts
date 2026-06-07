import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Allow the dev server to accept requests proxied through a Cloudflare quick
  // tunnel (used for testing passkeys/WebAuthn over HTTPS on a phone).
  allowedDevOrigins: ['*.trycloudflare.com'],
  // Enable Firebase App Hosting CDN caching for blog/dev routes.
  // On-demand revalidation via revalidatePath() purges both Next.js Full Route Cache
  // and the Firebase App Hosting CDN layer simultaneously, then pre-warms a fresh cache.
  // s-maxage: CDN caches for up to 1 year; stale-while-revalidate: serve stale during
  // background revalidation; must-revalidate: never serve truly stale beyond max-age.
  async redirects() {
    return [
      {
        source: '/blog/why-rich-and-luxury-websites-are-obsolete',
        destination: '/blog/rich-lavish-websites-outdated-reason',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/blog',
        headers: [{ key: 'Cache-Control', value: 's-maxage=31536000, stale-while-revalidate' }],
      },
      {
        source: '/blog/:path*',
        headers: [{ key: 'Cache-Control', value: 's-maxage=31536000, stale-while-revalidate' }],
      },
      {
        source: '/dev',
        headers: [{ key: 'Cache-Control', value: 's-maxage=31536000, stale-while-revalidate' }],
      },
      {
        source: '/dev/:path*',
        headers: [{ key: 'Cache-Control', value: 's-maxage=31536000, stale-while-revalidate' }],
      },
    ];
  },
  images: {
    // WebP only: ~10x faster to encode than AVIF on first request (sub-0.5s target)
    formats: ["image/webp"],
    // Allow Next.js to optimize images served from Google Cloud Storage
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/noe-shiftica.firebasestorage.app/**",
      },
      {
        // Firebase Storage public URLs
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/noe-shiftica.firebasestorage.app/**",
      },
    ],
    // High-performance cache: 1 year (Firebase App Hosting CDN will honor this)
    minimumCacheTTL: 31536000,
    // Refined sizes to minimize wasted bandwidth. 
    // Device sizes: trigger point for specific screen widths.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes: smaller increments for UI components.
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Quality 75 default — excellent visual quality at ~40% smaller file size vs q90
    qualities: [25, 50, 75],
  },
};

export default withPayload(nextConfig);
