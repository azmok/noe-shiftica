import type { CollectionConfig } from 'payload'
import { slugField } from 'payload-plugin-slug'
import { revalidatePath } from 'next/cache'

export const Posts: CollectionConfig = {
    slug: 'posts',
    admin: {
        useAsTitle: 'title',
        livePreview: {
            // プレビューしたい実際のフロントエンドのURLを指定する
            url: ({ data }) => {
                const url = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
                // 新規作成時は slug がないので、プレビュー側で適切にハンドルさせる、
                // または Payload のプレビュー機能自体にボタンを出させるために URL を返す
                return `${url}/blog/${data?.slug || 'preview'}?preview=true`;
            },
        }
    },
    access: {
        read: () => true,
    },
    hooks: {
        afterChange: [
            ({ doc, operation }) => {
                if (operation === 'create' || operation === 'update') {
                    // ブログ一覧ページと各記事ページのキャッシュを破棄し、次回アクセス時に静的生成(SSG)させる
                    revalidatePath('/blog');
                    if (doc.slug) {
                        revalidatePath(`/blog/${doc.slug}`);
                    }
                }
                return doc;
            }
        ],
        afterDelete: [
            ({ doc }) => {
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
        ...slugField('title', {
            slugOverrides: {
                admin: {
                    position: 'sidebar',
                    hidden: true,
                },
            },
            checkboxOverrides: {
                admin: {
                    hidden: true,
                },
            },
        }),
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
        // src/collections/Posts.ts の fields 配列の中に追加するコード
        {
            name: 'heroImage', // APIで取得する時の名前や
            type: 'upload',
            relationTo: 'media', // 画像を管理してるコレクション名（デフォルトは'media'が多い）
            label: 'Hero Image',
            required: false, // 必須にするなら true
            admin: {
                position: 'sidebar', // 右側のサイドバーに配置すると管理画面がスッキリするで！
            },
        }
    ],
}
