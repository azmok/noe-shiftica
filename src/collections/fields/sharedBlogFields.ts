import type { Field } from 'payload'

/**
 * Shared blog fields used by both Posts and TechPosts collections.
 *
 * Extracted from the existing Posts.ts field definitions.
 * Posts.ts is NOT refactored to use this (protected file),
 * but new collections (e.g., TechPosts) should use this to
 * maintain field parity and avoid duplication.
 */
export function getSharedBlogFields(): Field[] {
    return [
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
            name: 'tagsEditor',
            type: 'ui',
            admin: {
                position: 'sidebar',
                components: {
                    Field: '@/components/admin/TagsField#TagsField',
                },
            },
        },
        {
            name: 'customMetaData',
            type: 'json',
            admin: {
                position: 'sidebar',
                description: 'MarkdownのFrontmatterに含まれる未知のメタデータがここに格納されます',
                components: {
                    Field: '@/components/admin/JsonCodeField#JsonCodeField',
                },
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
    ]
}
