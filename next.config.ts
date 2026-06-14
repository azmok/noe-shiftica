import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Allow the dev server to accept requests proxied through a Cloudflare quick
  // tunnel (used for testing passkeys/WebAuthn over HTTPS on a phone).
  allowedDevOrigins: ['*.trycloudflare.com'],
  // CDN caching for /blog and /dev is left to Firebase App Hosting's native management.
  //
  // We intentionally do NOT set a manual `Cache-Control` (no s-maxage, no no-store) for
  // these routes. A manual long `s-maxage` (added in c7f7ff2) pinned the Google CDN edge
  // for up to a year, and `revalidatePath()` could not purge that edge — so post edits
  // never appeared on normal navigation / browser back-forward (only a hard reload, which
  // sends `Cache-Control: no-cache`, briefly revalidated against origin). The reverse —
  // forcing `no-store` — would kill BFCache and the CMS speed goals (see rules.md §4-E).
  //
  // By leaving the headers to the framework, App Hosting binds its CDN edge to Next.js's
  // on-demand revalidation, so revalidatePath() in Posts.ts hooks invalidates the edge in
  // tandem with the Full Route Cache while preserving BFCache and edge speed.
  // (See .antigravity/bugs/isr-caching.md and rules.md §4-E.)
  async redirects() {
    return [
      {
        source: '/blog/why-rich-and-luxury-websites-are-obsolete',
        destination: '/blog/rich-lavish-websites-outdated-reason',
        permanent: true,
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
