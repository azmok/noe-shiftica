import { Inconsolata, DM_Sans, DM_Serif_Display, Shippori_Mincho, Oxanium, Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import "./styles.css";
import { CustomCursor } from "./components/CustomCursor";
import { ProgressBar } from "./components/ProgressBar";

const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: "--font-inconsolata",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
  weight: ["400"],
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  variable: "--font-shippori-mincho",
  display: "swap",
  weight: ["400", "500", "600"],
});

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  weight: ["400", "500", "700"],
});

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Noe Shiftica | Design the Shift.",
    description: "AIとデザインでビジネスの本質を設計するスタジオ。",
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
      className={`${inconsolata.variable} ${dmSans.variable} ${dmSerifDisplay.variable} ${shipporiMincho.variable} ${oxanium.variable} ${notoSansJP.variable}`}
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
