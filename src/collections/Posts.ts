import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { translateToSlug } from '../lib/translateToSlug'

const FALLBACK_OG_IMAGE =
    'https://firebasestorage.googleapis.com/v0/b/noe-shiftica.firebasestorage.app/o/og-images%2FScreenshot%202026-03-20%20033637.png?alt=media&token=85010d4b-7b48-4a64-9288-b19e7e43c2c4'

const populateOgImage: CollectionBeforeChangeHook = async ({ data, req }) => {
    // Check if status is becoming "published"
    // In beforeChange, the key is usually just data.status or data._status depending on how drafting is implemented.
    // Based on previous code, it's doc.status.
    if (data._status === 'published' || data.status === 'published') {
        try {
            const heroImageId = data.heroImage;
            if (!heroImageId) {
                data.ogImage = FALLBACK_OG_IMAGE;
                return data;
            }

            // Fetch the media document to get the URL
            const mediaDoc = await req.payload.findByID({
                collection: 'media',
                id: typeof heroImageId === 'object' ? heroImageId.id : heroImageId,
                depth: 0,
            });

            if (mediaDoc) {
                // Prefer the OG-optimized variant (1200×630); fall back to original
                data.ogImage = (mediaDoc.sizes as any)?.og?.url || mediaDoc.url || FALLBACK_OG_IMAGE;
            } else {
                data.ogImage = FALLBACK_OG_IMAGE;
            }
        } catch (e) {
            console.error('[populateOgImage] error:', e);
        }
    }
    return data;
}

export const Posts: CollectionConfig = {
    slug: 'posts',
    admin: {
        useAsTitle: 'title',
        livePreview: {
            // プレビューしたい実際のフロントエンドのURLを指定する
            url: ({ data }) => {
                // 相対パスを返すことで、localhost、IPアドレス、本番環境のドメインなど、
                // アクセスしているブラウザのドメインを自動的に引き継ぎます。
                return `/blog/${data?.slug || 'preview'}/preview`;
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
        beforeChange: [populateOgImage],
        beforeValidate: [
            async ({ data }) => {
                // Auto-generate slug from title only when slug is empty
                // Supports Japanese/CJK titles via translation
                if (data && !data.slug && data.title) {
                    data.slug = await translateToSlug(data.title)
                }
                return data;
            }
        ],
        afterChange: [
            async ({ doc, operation }) => {
                if (operation === 'create' || operation === 'update') {
                    // ブログ一覧ページと各記事ページのキャッシュを破棄し、次回アクセス時に静的生成(SSG)させる
                    if (process.env.PAYLOAD_SYNC_MODE !== 'true') {
                        const { revalidatePath } = await import('next/cache');
                        revalidatePath('/blog');
                        if (doc.slug) {
                            revalidatePath(`/blog/${doc.slug}`);
                        }
                    }
                }
                return doc;
            }
        ],
        afterDelete: [
            async ({ doc }) => {
                if (process.env.PAYLOAD_SYNC_MODE !== 'true') {
                    const { revalidatePath } = await import('next/cache');
                    revalidatePath('/blog');
                    if (doc.slug) {
                        revalidatePath(`/blog/${doc.slug}`);
                    }
                }
                return doc;
            }
        ]
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'description',
            type: 'textarea',
            admin: {
                description: '記事の概要文。AIによって自動生成することも可能です。',
            },
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
            name: 'author',
            type: 'relationship',
            relationTo: 'users',
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'publishedAt',
            type: 'date',
            admin: {
                position: 'sidebar',
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        },
        {
            name: 'categories',
            type: 'relationship',
            relationTo: 'categories',
            hasMany: true,
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'content',
            type: 'richText',
            required: true,
        },
        {
            name: 'coverImage',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: 'heroImage',
            type: 'upload',
            relationTo: 'media',
            label: 'Hero Image',
            required: false,
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'customMetaData',
            type: 'json',
            admin: {
                position: 'sidebar',
                description: 'MarkdownのFrontmatterに含まれる未知のメタデータがここに格納されます',
            },
        },
        {
            name: 'htmlEmbed',
            type: 'upload',
            relationTo: 'html-files',
            label: '埋め込みHTMLファイル',
            required: false,
        },
        {
            name: 'ogImage',
            type: 'text',
            label: 'OG画像URL',
            admin: {
                position: 'sidebar',
                readOnly: true,
                description: '記事公開時にHero Imageから自動生成されます。',
            },
        },
    ],
}
