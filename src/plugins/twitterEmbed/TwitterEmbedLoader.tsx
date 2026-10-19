"use client"

import Script from "next/script"

declare global {
    interface Window {
        twttr?: { widgets?: { load: (el?: Element) => void } }
    }
}

// X (Twitter) embeds live in raw-HTML code blocks, which are injected via
// dangerouslySetInnerHTML — and <script> tags inserted that way never run.
// So the embed's own widgets.js is dropped at import time and loaded here
// instead, turning every <blockquote class="twitter-tweet"> into a card.
// onReady also fires on client-side navigation once the script is cached,
// so blockquotes on the next article get converted too.
export const TwitterEmbedLoader = () => (
    <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onReady={() => window.twttr?.widgets?.load()}
    />
)
