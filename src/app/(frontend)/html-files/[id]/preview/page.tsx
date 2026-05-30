import React from "react"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { HtmlFilePreviewClient } from "./client"

export default async function HtmlFilePreviewPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    // Force Next.js to skip dynamic path caching so we always pull fresh draft data
    noStore()

    const { id } = await params
    const payload = await getPayload({ config: configPromise })

    let initialData = null

    if (id !== 'preview') {
        try {
            initialData = await payload.findByID({
                collection: "html-files",
                id,
                depth: 0,
                draft: true,
                overrideAccess: true,
            })
        } catch (e) {
            notFound()
        }
    }

    if (!initialData) {
        // Fallback placeholder structure for unsaved / new documents
        initialData = {
            id,
            bodyHtml: "",
            embedCss: "",
        }
    }

    return <HtmlFilePreviewClient initialData={initialData} />
}
