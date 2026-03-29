import { Inconsolata, DM_Sans, DM_Serif_Display, Shippori_Mincho, Oxanium } from "next/font/google";
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

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html 
      lang="ja" 
      className={`${inconsolata.variable} ${dmSans.variable} ${dmSerifDisplay.variable} ${shipporiMincho.variable} ${oxanium.variable}`}
      data-scroll-behavior="smooth" 
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body suppressHydrationWarning>
        <GoogleAnalytics />
        <MobileMenuProvider>
          <ProgressBar />
          <JsonLd />
          <CustomCursor />
          <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
            {children}
          </main>
          <MobileBottomNav />
          <MobileMenuButton />
        </MobileMenuProvider>
        <Script
          id="typekit"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(d){var config={kitId:'jtq7dsy',scriptTimeout:3000,async:true},h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\\bwf-loading\\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)})(document);`,
          }}
        />
      </body>
    </html>
  );
}
