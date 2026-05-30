'use client'

import React from "react"
import { useLivePreview } from "@payloadcms/live-preview-react"

export function HtmlFilePreviewClient({ initialData }: { initialData: any }) {
    const { data } = useLivePreview({
        initialData,
        serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
        depth: 0,
    })

    return (
        <div className="w-full min-h-screen bg-background-void text-slate-100 p-8 font-sans relative overflow-hidden">
            {/* Scoped CSS Injector - Evaluates styles extracted from the HTML */}
            {data?.embedCss && (
                <div dangerouslySetInnerHTML={{ __html: data.embedCss }} />
            )}

            {/* Premium Void Depth Blobs for aesthetics */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neu-primary/10 blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-neu-primary/5 blur-[100px]" />
            </div>

            {/* Live Rendered Content Container with premium glass styling */}
            <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl relative z-10 my-8">
                {data?.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
                ) : (
                    <div className="text-slate-500 italic text-center py-20">
                        HTMLコンテンツが空、またはアップロードされていません。文字を入力するとリアルタイムにここに描画されます。
                    </div>
                )}
            </div>
        </div>
    )
}
