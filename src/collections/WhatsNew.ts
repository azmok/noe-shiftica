import type { CollectionConfig } from 'payload'
import { translateToSlug } from '../lib/translateToSlug'

/**
 * WhatsNew — "リッチコンテンツ型" showcase collection.
 *
 * 1 record = 1 product/feature announcement, written for clients
 * ("こう使えますよ"). Fully public + SEO-optimized.
 *
 * Intentionally uses the spec's own field names (excerpt / featuredImage /
 * seo group) rather than the blog's (description / coverImage / customMetaData)
 * so this site can demonstrate two distinct Payload collection designs.
 *
 * Uses a plain `status` select (draft/published) per spec — NOT Payload's
 * versions/drafts — so public read access can filter on it directly.
 */
export const WhatsNew: CollectionConfig = {
    slug: 'whats-new',
    labels: {
        singular: "What's New",
        plural: "What's New",
    },
    admin: {
        useAsTitle: 'title',
        group: 'Pages',
        defaultColumns: ['title', 'status', 'publishedAt', 'updatedAt'],
        preview: (doc) => `/whats-new/${(doc?.slug as string) || ''}`,
    },
    access: {
        // Public can only read published entries; authenticated admins see all.
        read: ({ req: { user } }) => {
            if (user) return true
            return {
                status: {
                    equals: 'published',
                },
            }
        },
        // create / update / delete default to authenticated-only (Payload default).
    },
    hooks: {
        beforeValidate: [
            async ({ data }) => {
                // Auto-generate slug from title only when empty (supports CJK titles).
                if (data && !data.slug && data.title) {
                    data.slug = await translateToSlug(data.title)
                }
                return data
            },
        ],
        beforeChange: [
            async ({ data }) => {
                // Stamp publishedAt on first publish if the author left it empty.
                if (data.status === 'published' && !data.publishedAt) {
                    data.publishedAt = new Date().toISOString()
                }
                return data
            },
        ],
        afterChange: [
            async ({ doc, operation }) => {
                if (operation !== 'create' && operation !== 'update') return doc
                // 1. Local Next.js cache revalidation
                try {
                    const { revalidatePath } = await import('next/cache')
                    revalidatePath('/whats-new')
                    if (doc.slug) revalidatePath(`/whats-new/${doc.slug}`)
                } catch (err) {
                    console.warn(`[WhatsNew Hook:afterChange] Local revalidation skipped: ${err instanceof Error ? err.message : String(err)}`)
                }
                // 2. Production webhook revalidation (for edits made locally)
                try {
                    const secret = process.env.REVALIDATE_SECRET
                    if (secret) {
                        await fetch('https://noe-shiftica.com/api/revalidate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ secret, slug: doc.slug, collection: 'whats-new' }),
                        })
                    }
                } catch (e) {
                    console.error('[WhatsNew Hook:afterChange] Revalidation request error:', e)
                }
                return doc
            },
        ],
        afterDelete: [
            async ({ doc }) => {
                try {
                    const { revalidatePath } = await import('next/cache')
                    revalidatePath('/whats-new')
                    if (doc.slug) revalidatePath(`/whats-new/${doc.slug}`)
                } catch (err) {
                    console.warn(`[WhatsNew Hook:afterDelete] Local revalidation skipped: ${err instanceof Error ? err.message : String(err)}`)
                }
                try {
                    const secret = process.env.REVALIDATE_SECRET
                    if (secret) {
                        await fetch('https://noe-shiftica.com/api/revalidate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ secret, slug: doc.slug, collection: 'whats-new' }),
                        })
                    }
                } catch (e) {
                    console.error('[WhatsNew Hook:afterDelete] Revalidation request error:', e)
                }
                return doc
            },
        ],
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                position: 'sidebar',
                description: 'URLに使用される識別子です（タイトルから自動生成されます）',
            },
        },
        {
            name: 'excerpt',
            type: 'textarea',
            admin: {
                description: '一覧カードと meta description に使用される概要文。',
            },
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: '一覧カードと記事ヘッダーに表示されるアイキャッチ画像。',
            },
        },
        {
            name: 'content',
            type: 'richText',
            required: true,
        },
        {
            name: 'publishedAt',
            type: 'date',
            required: true,
            admin: {
                position: 'sidebar',
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'draft',
            options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
            ],
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'seo',
            type: 'group',
            label: 'SEO',
            admin: {
                description: '指定があれば <title> / meta description / OGP に優先的に使用されます。',
            },
            fields: [
                {
                    name: 'metaTitle',
                    type: 'text',
                },
                {
                    name: 'metaDescription',
                    type: 'textarea',
                },
                {
                    name: 'ogImage',
                    type: 'upload',
                    relationTo: 'media',
                },
            ],
        },
    ],
}
