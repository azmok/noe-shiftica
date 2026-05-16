import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { translateToSlug } from '../lib/translateToSlug'

const FALLBACK_OG_IMAGE =
    'https://firebasestorage.googleapis.com/v0/b/noe-shiftica.firebasestorage.app/o/fallback-image.png?alt=media&token=731d39a7-d242-4ba5-b5c3-5fdf6695eb90'

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
                    // 1. ローカルサーバー(実行環境)のキャッシュ破棄
                    const { revalidatePath } = await import('next/cache');
                    revalidatePath('/blog');
                    if (doc.slug) {
                        revalidatePath(`/blog/${doc.slug}`);
                    }

                    // 2. 本番環境(App Hosting)への明示的なWebhookによるキャッシュ破棄
                    // (ローカルで記事を編集した場合でも、本番に反映させるため)
                    try {
                        const targetUrl = 'https://noe-shiftica.com/api/revalidate';
                        const secret = process.env.REVALIDATE_SECRET;
                        if (secret) {
                            fetch(targetUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    secret,
                                    slug: doc.slug
                                })
                            }).catch(err => {
                                console.error('[Posts Hook] 本番キャッシュ破棄に失敗しました:', err);
                            });
                        }
                    } catch (e) {
                        console.error('[Posts Hook] 再生成リクエストエラー:', e);
                    }
                }
                return doc;
            }
        ],
        afterDelete: [
            async ({ doc }) => {
                const { revalidatePath } = await import('next/cache');
                revalidatePath('/blog');
                if (doc.slug) {
                    revalidatePath(`/blog/${doc.slug}`);
                }

                // 本番環境のキャッシュも破棄する
                try {
                    const targetUrl = 'https://noe-shiftica.com/api/revalidate';
                    const secret = process.env.REVALIDATE_SECRET;
                    if (secret) {
                        fetch(targetUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ secret, slug: doc.slug })
                        }).catch(err => {
                            console.error('[Posts Hook] 本番キャッシュ破棄に失敗しました:', err);
                        });
                    }
                } catch (e) {
                    console.error('[Posts Hook] 再生成リクエストエラー:', e);
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
                components: {
                    Field: '@/components/TagField#TagField',
                },
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
