import { Inconsolata, Oxanium } from "next/font/google";

// Only the homepage uses these, so they are loaded (and preloaded) only there.

// .oxanium-heading uses 600; the hero heading uses 500 on desktop.
export const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  display: "swap",
  weight: ["500", "600"],
});

export const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: "--font-inconsolata",
  display: "swap",
});
