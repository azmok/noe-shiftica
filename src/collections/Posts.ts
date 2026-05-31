import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { translateToSlug } from '../lib/translateToSlug'



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
                    try {
                        const { revalidatePath } = await import('next/cache');
                        revalidatePath('/blog');
                        if (doc.slug) {
                            revalidatePath(`/blog/${doc.slug}`);
                        }
                        console.log(`[Posts Hook:afterChange] Local cache revalidated for slug: ${doc.slug}`);
                    } catch (err: any) {
                        console.warn(`[Posts Hook:afterChange] Local cache revalidation skipped (likely outside Next.js server): ${err.message}`);
                    }

                    // 2. 本番環境(App Hosting)への明示的なWebhookによるキャッシュ破棄
                    // (ローカルで記事を編集した場合でも、本番に反映させるため)
                    try {
                        const targetUrl = 'https://noe-shiftica.com/api/revalidate';
                        const secret = process.env.REVALIDATE_SECRET;
                        if (secret) {
                            console.log(`[Posts Hook:afterChange] Sending revalidate request for slug: ${doc.slug}...`);
                            const res = await fetch(targetUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    secret,
                                    slug: doc.slug
                                })
                            });
                            console.log(`[Posts Hook:afterChange] Revalidate response status: ${res.status}`);
                        } else {
                            console.warn('[Posts Hook:afterChange] REVALIDATE_SECRET is not set');
                        }
                    } catch (e) {
                        console.error('[Posts Hook:afterChange] 再生成リクエストエラー:', e);
                    }
                }
                return doc;
            }
        ],
        afterDelete: [
            async ({ doc }) => {
                // 1. ローカルサーバー(実行環境)のキャッシュ破棄
                try {
                    const { revalidatePath } = await import('next/cache');
                    revalidatePath('/blog');
                    if (doc.slug) {
                        revalidatePath(`/blog/${doc.slug}`);
                    }
                    console.log(`[Posts Hook:afterDelete] Local cache revalidated for slug: ${doc.slug}`);
                } catch (err: any) {
                    console.warn(`[Posts Hook:afterDelete] Local cache revalidation skipped (likely outside Next.js server): ${err.message}`);
                }

                // 本番環境のキャッシュも破棄する
                try {
                    const targetUrl = 'https://noe-shiftica.com/api/revalidate';
                    const secret = process.env.REVALIDATE_SECRET;
                    if (secret) {
                        console.log(`[Posts Hook:afterDelete] Sending revalidate request for slug: ${doc.slug}...`);
                        const res = await fetch(targetUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ secret, slug: doc.slug })
                        });
                        console.log(`[Posts Hook:afterDelete] Revalidate response status: ${res.status}`);
                    } else {
                        console.warn('[Posts Hook:afterDelete] REVALIDATE_SECRET is not set');
                    }
                } catch (e) {
                    console.error('[Posts Hook:afterDelete] 再生成リクエストエラー:', e);
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
            filterOptions: {
                width: {
                    greater_than_equal: 1000,
                },
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
