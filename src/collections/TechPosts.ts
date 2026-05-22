import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { translateToSlug } from '../lib/translateToSlug'
import { getSharedBlogFields } from './fields/sharedBlogFields'

const FALLBACK_OG_IMAGE =
    'https://firebasestorage.googleapis.com/v0/b/noe-shiftica.firebasestorage.app/o/fallback-image.png?alt=media&token=731d39a7-d242-4ba5-b5c3-5fdf6695eb90'

const populateOgImage: CollectionBeforeChangeHook = async ({ data, req }) => {
    if (data._status === 'published' || data.status === 'published') {
        try {
            const heroImageId = data.heroImage;
            if (!heroImageId) {
                data.ogImage = FALLBACK_OG_IMAGE;
                return data;
            }

            const mediaDoc = await req.payload.findByID({
                collection: 'media',
                id: typeof heroImageId === 'object' ? heroImageId.id : heroImageId,
                depth: 0,
            });

            if (mediaDoc) {
                data.ogImage = (mediaDoc.sizes as any)?.og?.url || mediaDoc.url || FALLBACK_OG_IMAGE;
            } else {
                data.ogImage = FALLBACK_OG_IMAGE;
            }
        } catch (e) {
            console.error('[TechPosts:populateOgImage] error:', e);
        }
    }
    return data;
}

export const TechPosts: CollectionConfig = {
    slug: 'tech-posts',
    admin: {
        useAsTitle: 'title',
        group: 'Blog',
        livePreview: {
            url: ({ data }) => {
                return `/dev/${data?.slug || 'preview'}/preview`;
            },
        },
        defaultColumns: ['title', '_status', 'publishedAt', 'updatedAt'],
    },
    versions: {
        drafts: {
            autosave: false,
        },
    },
    access: {
        read: () => true,
    },
    hooks: {
        beforeChange: [
            populateOgImage,
            async ({ data }) => {
                if ((data._status === 'published' || data.status === 'published') && !data.publishedAt) {
                    data.publishedAt = new Date().toISOString();
                }
                return data;
            }
        ],
        beforeValidate: [
            async ({ data }) => {
                if (data && !data.slug && data.title) {
                    data.slug = await translateToSlug(data.title)
                }
                return data;
            }
        ],
        afterChange: [
            async ({ doc, operation }) => {
                if (operation === 'create' || operation === 'update') {
                    // 1. Local server cache revalidation
                    try {
                        const { revalidatePath } = await import('next/cache');
                        revalidatePath('/dev');
                        if (doc.slug) {
                            revalidatePath(`/dev/${doc.slug}`);
                        }
                        console.log(`[TechPosts Hook:afterChange] Local cache revalidated for slug: ${doc.slug}`);
                    } catch (err: any) {
                        console.warn(`[TechPosts Hook:afterChange] Local cache revalidation skipped: ${err.message}`);
                    }

                    // 2. Production webhook revalidation
                    try {
                        const targetUrl = 'https://noe-shiftica.com/api/revalidate';
                        const secret = process.env.REVALIDATE_SECRET;
                        if (secret) {
                            console.log(`[TechPosts Hook:afterChange] Sending revalidate request for slug: ${doc.slug}...`);
                            const res = await fetch(targetUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    secret,
                                    slug: doc.slug,
                                    collection: 'tech-posts',
                                })
                            });
                            console.log(`[TechPosts Hook:afterChange] Revalidate response status: ${res.status}`);
                        } else {
                            console.warn('[TechPosts Hook:afterChange] REVALIDATE_SECRET is not set');
                        }
                    } catch (e) {
                        console.error('[TechPosts Hook:afterChange] Revalidation request error:', e);
                    }
                }
                return doc;
            }
        ],
        afterDelete: [
            async ({ doc }) => {
                // 1. Local server cache revalidation
                try {
                    const { revalidatePath } = await import('next/cache');
                    revalidatePath('/dev');
                    if (doc.slug) {
                        revalidatePath(`/dev/${doc.slug}`);
                    }
                    console.log(`[TechPosts Hook:afterDelete] Local cache revalidated for slug: ${doc.slug}`);
                } catch (err: any) {
                    console.warn(`[TechPosts Hook:afterDelete] Local cache revalidation skipped: ${err.message}`);
                }

                // Production webhook revalidation
                try {
                    const targetUrl = 'https://noe-shiftica.com/api/revalidate';
                    const secret = process.env.REVALIDATE_SECRET;
                    if (secret) {
                        console.log(`[TechPosts Hook:afterDelete] Sending revalidate request for slug: ${doc.slug}...`);
                        const res = await fetch(targetUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ secret, slug: doc.slug, collection: 'tech-posts' })
                        });
                        console.log(`[TechPosts Hook:afterDelete] Revalidate response status: ${res.status}`);
                    } else {
                        console.warn('[TechPosts Hook:afterDelete] REVALIDATE_SECRET is not set');
                    }
                } catch (e) {
                    console.error('[TechPosts Hook:afterDelete] Revalidation request error:', e);
                }

                return doc;
            }
        ]
    },
    fields: [
        ...getSharedBlogFields(),
    ],
}
