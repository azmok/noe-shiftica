import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    // Serve WebP/AVIF when browser supports it (Next.js default, explicit for clarity)
    formats: ["image/avif", "image/webp"],
    // Cache optimized images on the CDN for 1 year
    minimumCacheTTL: 31536000,
    // Common widths used in responsive blog layouts
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 400],
    // Allow quality 85 which is used as default in GcsImage
    qualities: [75, 85],
  },
};

export default withPayload(nextConfig);
