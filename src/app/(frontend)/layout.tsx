import { Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import "./styles.css";
import { CustomCursor } from "./components/CustomCursor";
import { ProgressBar } from "./components/ProgressBar";

// Google's build of Noto Sans JP is a variable font split into ~120 unicode-range
// chunks, so browsers download only the chunks for characters on the page. Which
// chunks a page needs can't be known ahead of time, so nothing is preloaded.
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Intentionally no maximumScale: disabling pinch-zoom is an accessibility
  // anti-pattern (flagged by Lighthouse) and blocks users who need to zoom.
};

// Brand share card used as the default OG/Twitter image for pages that don't
// supply their own (homepage, /about, /services, …). Article pages override
// this with their own cover/hero image. This is the same asset used as the
// published-post ogImage fallback, so it is guaranteed to exist.
const DEFAULT_OG_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/noe-shiftica.firebasestorage.app/o/fallback-image.png?alt=media&token=731d39a7-d242-4ba5-b5c3-5fdf6695eb90";

export const metadata = {
  metadataBase: new URL("https://noe-shiftica.com"),
  title: {
    template: "%s | Noe Shiftica",
    default: "Noe Shiftica | Design the Shift.",
  },
  description:
    "AIとデザインでビジネスの本質を設計する。Noe Shifticaは本質を掴み（Noe）、変化の構造を設計（Shiftica）するAIプロデュース＆デザインスタジオです。",
  keywords: [
    "Web制作",
    "Next.js",
    "デザイン",
    "AI",
    "Noe Shiftica",
    "ノエ・シフティカ",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://noe-shiftica.com",
    siteName: "Noe Shiftica",
    title: "Noe Shiftica | Design the Shift.",
    description: "AIとデザインでビジネスの本質を設計するスタジオ。",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Noe Shiftica | Design the Shift.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@noeShiftica",
    creator: "@noeShiftica",
    title: "Noe Shiftica | Design the Shift.",
    description: "AIとデザインでビジネスの本質を設計するスタジオ。",
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-precomposed.png", rel: "apple-touch-icon-precomposed" },
    ],
  },
};

import { MobileBottomNav } from "./components/MobileBottomNav";
import { JsonLd } from "./components/JsonLd";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import { MobileMenuButton } from "@/components/MobileMenuButton";

import GoogleAnalytics from "./components/GoogleAnalytics";
import { MobileMenuOverlay } from "@/components/MobileMenuOverlay";
import { HearingResumeWidget } from "@/components/HearingResumeWidget";

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html
      lang="ja"
      className={notoSansJP.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body suppressHydrationWarning className="selection:bg-(--color-neu-primary)/30">
        <GoogleAnalytics />
        <MobileMenuProvider>
          <ProgressBar />
          <JsonLd />
          <CustomCursor />
          <MobileMenuOverlay />
          <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
            {children}
          </main>
          <MobileBottomNav />
          <MobileMenuButton />
          <HearingResumeWidget />
        </MobileMenuProvider>

        {/* 
          GLOBAL FAILSAFE: Force visibility for any images stuck at opacity: 0.
          This handles edge cases where browser cache + React hydration cause 
          images to remain invisible after page reloads.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Suppress Hydration Mismatch Warnings globally (often caused by browser extensions)
                const originalError = console.error;
                console.error = function(...args) {
                  const msg = args[0];
                  if (
                    typeof msg === 'string' &&
                    (msg.includes('Hydration') ||
                     msg.includes('hydrated') ||
                     msg.includes('did not match') ||
                     msg.includes('attribute') ||
                     msg.includes('suppressHydrationWarning') ||
                     msg.includes('mismatch'))
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };

                const forceImages = () => {
                  document.querySelectorAll('img').forEach(img => {
                    try {
                      // Skip if it's explicitly hidden by a non-GcsImage reason
                      if (img.closest('.hidden')) return;
                      
                      const inlineStyle = img.style.opacity;
                      const computedStyle = window.getComputedStyle(img);
                      
                      // If inline or computed opacity is 0, wipe it out and force 1
                      if (inlineStyle === '0' || computedStyle.opacity === '0') {
                        img.style.removeProperty('opacity');
                        img.style.setProperty('opacity', '1', 'important');
                        img.style.setProperty('visibility', 'visible', 'important');
                        img.classList.add('is-forced-loaded');
                      }
                    } catch (e) {}
                  });
                };
                // Immediate check
                forceImages();
                // Standard events
                window.addEventListener('load', forceImages);
                window.addEventListener('pageshow', forceImages);
                // Periodic check during the critical hydration window (first 8s)
                const interval = setInterval(forceImages, 1000);
                setTimeout(() => clearInterval(interval), 8000);
              })();
            `
          }}
        />
      </body>
    </html>
  );
}
