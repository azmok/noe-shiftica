import localFont from "next/font/local";

// Only the homepage uses these, so they are loaded (and preloaded) only there.
//
// Self-hosted on purpose: next/font/google fetches from Google at build time, and Google
// can answer with `fonts.gstatic.com/l/font?kit=…&skey=…&v=…` URLs that Turbopack cannot
// parse, which fails the production build without any code change.

// .oxanium-heading uses 600; the hero heading uses 500 on desktop.
export const oxanium = localFont({
  src: "./fonts/oxanium-latin-variable.woff2",
  variable: "--font-oxanium",
  display: "swap",
  weight: "500 600",
});

export const inconsolata = localFont({
  src: "./fonts/inconsolata-latin-variable.woff2",
  variable: "--font-inconsolata",
  display: "swap",
  weight: "200 900",
});
