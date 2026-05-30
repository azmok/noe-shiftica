'use client'

import React, { useEffect } from "react"
import { useLivePreview } from "@payloadcms/live-preview-react"
import { Post } from "@/payload-types"
import { PostArticle } from "./PostArticle"

export const LivePreview: React.FC<{
    initialPost: Post
    isPreview?: boolean
    prevPost?: Post | null
    nextPost?: Post | null
}> = ({ initialPost, isPreview, prevPost, nextPost }) => {
    // Error tunneling for debugging Live Preview hydration/runtime crashes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        console.log('[PreviewDebug] LivePreview client side initialized.');

        const handleError = (e: ErrorEvent) => {
            console.log('%c[PreviewDebug] FRONTEND ARTICLE RUNTIME ERROR:', 'background: #991b1b; color: white; font-weight: bold;', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                error: e.error ? {
                    name: e.error.name,
                    message: e.error.message,
                    stack: e.error.stack,
                } : null
            });
        };

        const handleRejection = (e: PromiseRejectionEvent) => {
            console.log('%c[PreviewDebug] FRONTEND ARTICLE UNHANDLED REJECTION:', 'background: #991b1b; color: white; font-weight: bold;', {
                reason: e.reason
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    const { data: post } = useLivePreview({
        initialData: initialPost,
        serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
        depth: 2,
    })

    return <PostArticle post={post} isPreview={isPreview} prevPost={prevPost} nextPost={nextPost} />
}
