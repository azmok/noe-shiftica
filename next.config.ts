import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Shares the ISR cache across Cloud Run containers via GCS (see cache-handler.mjs).
  cacheHandler: path.join(process.cwd(), "cache-handler.mjs"),
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
  // CORRECTION (verified in production 2026-10-04): revalidatePath() does NOT purge the
  // App Hosting CDN edge. After POST /api/revalidate the edge kept serving the same copy
  // (Age kept growing, Cdn-Cache-Status: hit), so with the framework default for static
  // pages (`s-maxage=31536000`) new posts / hero images only appeared after a redeploy.
  // Fix stays framework-native: CMS-backed pages export `revalidate = 60`, and
  // `expireTime` below caps the stale-while-revalidate window, giving
  // `s-maxage=60, stale-while-revalidate=240` → the edge is at most ~5 min behind a save.
  // (See .antigravity/bugs/isr-caching.md and rules.md §4-E.)
  expireTime: 300,
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

const payloadConfig = withPayload(nextConfig);
const payloadHeaders = payloadConfig.headers;

// withPayload adds Accept-CH / Critical-CH / Vary: Sec-CH-Prefers-Color-Scheme to every
// path (for the admin's light/dark theme). On the public site, Critical-CH makes Chrome
// throw away the first response and re-request every page (one extra round trip), and the
// Vary splits the CDN cache. Keep those headers on the admin only.
export default {
  ...payloadConfig,
  async headers() {
    const rules = payloadHeaders ? await payloadHeaders() : [];
    return rules.map((rule) =>
      rule.source === "/:path*" && rule.headers.some((h) => h.key === "Critical-CH")
        ? { ...rule, source: "/admin/:path*" }
        : rule,
    );
  },
} satisfies NextConfig;
