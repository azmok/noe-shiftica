"use client"

import { useEffect } from "react"

const decodeHash = (hash: string): string => {
    try {
        return decodeURIComponent(hash.replace(/^#/, ""))
    } catch {
        return ""
    }
}

// The article body is rendered twice (mobile + desktop, one hidden by CSS), so a
// plain #fragment can point at the hidden copy. This resolves heading clicks,
// in-page #links and the URL hash to whichever copy is currently visible.
export function HeadingAnchorBehavior({ scopeId }: { scopeId: string }) {
    useEffect(() => {
        const scope = document.getElementById(scopeId)
        if (!scope) return

        const visibleHeading = (id: string) =>
            Array.from(scope.querySelectorAll<HTMLElement>("[data-heading-id]")).find(
                (el) => el.dataset.headingId === id && el.offsetParent !== null,
            )

        const goTo = (id: string, { updateUrl, smooth }: { updateUrl: boolean; smooth: boolean }) => {
            const heading = visibleHeading(id)
            if (!heading) return false
            if (updateUrl) {
                const url = `#${id}`
                if (decodeHash(window.location.hash) === id) window.history.replaceState(window.history.state, "", url)
                else window.history.pushState(window.history.state, "", url)
            }
            scope.querySelectorAll("[data-heading-active]").forEach((el) => el.removeAttribute("data-heading-active"))
            heading.setAttribute("data-heading-active", "")
            heading.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" })
            return true
        }

        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            const target = event.target as Element
            const link = target.closest("a")
            let id: string | undefined
            if (link) {
                const href = link.getAttribute("href")
                if (!href?.startsWith("#")) return
                id = decodeHash(href)
            } else {
                const heading = target.closest<HTMLElement>("[data-heading-id]")
                if (!heading || window.getSelection()?.toString()) return
                id = heading.dataset.headingId
            }
            if (id && goTo(id, { updateUrl: true, smooth: true })) event.preventDefault()
        }

        const followHash = (smooth: boolean) => {
            const id = decodeHash(window.location.hash)
            if (id) goTo(id, { updateUrl: false, smooth })
        }
        const onHashChange = () => followHash(true)
        // Images above the heading can shift it after the first scroll.
        const onLoad = () => followHash(false)

        followHash(false)
        scope.addEventListener("click", onClick)
        window.addEventListener("hashchange", onHashChange)
        if (document.readyState !== "complete") window.addEventListener("load", onLoad, { once: true })
        return () => {
            scope.removeEventListener("click", onClick)
            window.removeEventListener("hashchange", onHashChange)
            window.removeEventListener("load", onLoad)
        }
    }, [scopeId])

    return null
}
