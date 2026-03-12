import { Inconsolata, DM_Sans, DM_Serif_Display, Shippori_Mincho } from "next/font/google";
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
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-precomposed.png", rel: "apple-touch-icon-precomposed" },
    ],
  },
};

import { MobileBottomNav } from "./components/MobileBottomNav";

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html 
      lang="ja" 
      className={`${inconsolata.variable} ${dmSans.variable} ${dmSerifDisplay.variable} ${shipporiMincho.variable}`} 
      data-scroll-behavior="smooth" 
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@200..800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(d) {
                var config = {
                  kitId: 'jtq7dsy',
                  scriptTimeout: 3000,
                  async: true
                },
                h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\\bwf-loading\\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)
              })(document);
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ProgressBar />
        <CustomCursor />
        <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
          {children}
        </main>
        <MobileBottomNav />
      </body>
    </html>
  );
}
