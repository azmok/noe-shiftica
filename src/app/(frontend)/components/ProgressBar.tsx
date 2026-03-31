"use client";

import NextTopLoader from 'nextjs-toploader';

export function ProgressBar() {
  return (
    <NextTopLoader
      color="hsla(312, 66%, 76%, 1)"
      initialPosition={0.08}
      crawlSpeed={200}
      height={5}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px hsla(312, 66%, 76%, 1), 0 0 5px hsla(234, 93%, 67%, 1)"
    />
  );
}
