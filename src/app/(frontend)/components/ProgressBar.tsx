"use client";

import NextTopLoader from 'nextjs-toploader';

export function ProgressBar() {
  return (
    <NextTopLoader
      color="var(--color-neu-primary)"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px var(--color-neu-primary),0 0 5px var(--color-neu-primary)"
    />
  );
}
