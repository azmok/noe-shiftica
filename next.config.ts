import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Prevent Firebase App Hosting CDN from caching blog HTML pages.
  // revalidatePath() purges Next.js's internal ISR cache but cannot purge the CDN
  // layer sitting in front of Cloud Run. Setting no-store on blog routes forces
  // every HTML request to pass through to the origin (Next.js), which always
  // serves either the cached ISR page or a freshly revalidated one.
  // Static assets (JS, CSS, images) are unaffected — they have their own cache headers.
  async headers() {
    return [
      {
        source: '/blog',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        source: '/blog/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
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
