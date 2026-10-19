import React from "react"
import type { HeadingJSXConverter } from "@payloadcms/richtext-lexical/react"
import styles from "./ArticleToc.module.css"

type HeadingConverter = NonNullable<typeof HeadingJSXConverter.heading>

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
)

// The body renders twice (mobile + desktop). Only the first tree carries a real
// `id`, so fragment IDs stay unique; HeadingAnchorBehavior scrolls to whichever
// copy is visible via data-heading-id.
export const headingWithAnchor = (idByNode: WeakMap<object, string>, withIds: boolean): HeadingConverter =>
    function AnchoredHeading({ node, nodesToJSX }) {
        const Tag = node.tag
        const children = nodesToJSX({ nodes: node.children })
        const id = idByNode.get(node)
        if (!id) return <Tag>{children}</Tag>
        return (
            <Tag id={withIds ? id : undefined} data-heading-id={id} className={styles.anchoredHeading}>
                {children}
                <a href={`#${id}`} className={styles.headingLink} aria-label="この見出しへのリンク">
                    <LinkIcon />
                </a>
            </Tag>
        )
    }
