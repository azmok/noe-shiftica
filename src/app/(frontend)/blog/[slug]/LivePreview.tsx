'use client'

import React from "react"
import { useLivePreview } from "@payloadcms/live-preview-react"
import { Post } from "@/payload-types"
import { PostArticle } from "./PostArticle"

export const LivePreview: React.FC<{
    initialPost: Post
    isPreview?: boolean
    prevPost?: Post | null
    nextPost?: Post | null
}> = ({ initialPost, isPreview, prevPost, nextPost }) => {
    const { data: post } = useLivePreview({
        initialData: initialPost,
        serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
        depth: 2,
    })

    return <PostArticle post={post} isPreview={isPreview} prevPost={prevPost} nextPost={nextPost} />
}
