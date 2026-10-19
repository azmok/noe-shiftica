"use client"

import { useEffect } from "react"

/**
 * Renders a post's `customCss`/`customJs` against the whole rendered article.
 *
 * CSS is wrapped in `@scope (#scopeId) { ... }` so authors can paste raw
 * selectors (as exported from Google Drive / iPad markdown tooling) without
 * manually prefixing them — the browser confines every rule to descendants
 * of the article root, so it can never leak onto other posts or site chrome.
 *
 * JS is injected as a real <script> tag (not innerHTML) so it actually
 * executes, mirroring the re-execution trick HtmlEmbedBlock uses for the
 * html-files embed path. Authors are expected to target the article's own
 * markup (class/id names unique to that post), same as an ordinary page script.
 */
export function ArticleCustomAssets({
    scopeId,
    css,
    js,
}: {
    scopeId: string
    css?: string | null
    js?: string | null
}) {
    useEffect(() => {
        if (!js || !js.trim()) return
        // Reference-counted via a window-level counter (not a ref flag) so
        // the script only ever runs ONCE no matter how many overlapping
        // mounts touch this effect (React StrictMode's dev-only
        // double-invoke, a Fast Refresh remount, ...).
        const key = `__articleJsExecCount_${scopeId}`
        const marker = `data-article-js-${scopeId}`
        const w = window as unknown as Record<string, number>
        w[key] = (w[key] || 0) + 1

        let observer: MutationObserver | null = null
        let settleTimer: number | null = null
        if (w[key] === 1) {
            const inject = () => {
                const script = document.createElement("script")
                script.setAttribute(marker, "")
                script.textContent = js
                document.body.appendChild(script)
            }
            // Wait for the article body to settle before running the
            // imported script. This component's effect can fire while the
            // article body (a large RichText tree — 200+ nodes for a long
            // post) is still being committed piecemeal (observed under
            // Payload's useLivePreview + React 18 concurrent rendering);
            // neither a plain mount check nor a single requestAnimationFrame
            // was a late enough signal — DOM mutations were still landing
            // under #<scopeId> after both. Debounce instead: only inject
            // once no new nodes have appeared under <body> for 150ms.
            const scheduleSettleCheck = () => {
                if (settleTimer !== null) window.clearTimeout(settleTimer)
                settleTimer = window.setTimeout(() => {
                    observer?.disconnect()
                    observer = null
                    inject()
                }, 150)
            }
            observer = new MutationObserver(scheduleSettleCheck)
            observer.observe(document.body, { childList: true, subtree: true })
            scheduleSettleCheck()
        }

        return () => {
            observer?.disconnect()
            if (settleTimer !== null) window.clearTimeout(settleTimer)
            w[key] = Math.max(0, (w[key] || 1) - 1)
            if (w[key] === 0) {
                document.body.querySelectorAll(`script[${marker}]`).forEach((el) => el.remove())
            }
        }
    }, [js, scopeId])

    if (!css || !css.trim()) return null

    return <style>{`@scope (#${scopeId}) {\n${css}\n}`}</style>
}
