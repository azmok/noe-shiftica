import React from "react";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./styles.css";
import { CustomCursor } from "./components/CustomCursor";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const notoSerif = Noto_Serif_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
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
    url: "https://noeshiftica.com", // FIXME: Actual Domain Later
    siteName: "Noe Shiftica",
    title: "Noe Shiftica | Design the Shift.",
    description: "AIとデザインでビジネスの本質を設計するスタジオ。",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noe Shiftica | Design the Shift.",
    description: "AIとデザインでビジネスの本質を設計するスタジオ。",
  },
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html lang="ja" className={`${notoSans.variable} ${notoSerif.variable}`}>
      <body>
        <CustomCursor />
        <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
