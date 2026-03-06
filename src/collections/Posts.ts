import type { CollectionConfig } from 'payload'
import { translateToSlug } from '../lib/translateToSlug'

export const Posts: CollectionConfig = {
    slug: 'posts',
    admin: {
        useAsTitle: 'title',
        livePreview: {
            // プレビューしたい実際のフロントエンドのURLを指定する
            url: ({ data }) => {
                const url = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
                return `${url}/blog/${data?.slug || 'preview'}?preview=true`;
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
                    const { revalidatePath } = await import('next/cache');
                    revalidatePath('/blog');
                    if (doc.slug) {
                        revalidatePath(`/blog/${doc.slug}`);
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
        }
    ],
}
