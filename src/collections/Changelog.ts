import type { CollectionConfig } from 'payload'

/**
 * Changelog — "構造化型" showcase collection.
 *
 * Factual log of site updates, rendered as a single chronological timeline page
 * (no per-entry article pages). Category follows "Keep a Changelog".
 *
 * Operational note: entries are drafted semi-automatically from git commit
 * history (see project CLAUDE.md), but publishing is always a human decision —
 * hence the explicit `status` select.
 */
export const Changelog: CollectionConfig = {
    slug: 'changelog',
    labels: {
        singular: 'Changelog Entry',
        plural: 'Changelog',
    },
    admin: {
        useAsTitle: 'date',
        group: 'Pages',
        defaultColumns: ['date', 'category', 'version', 'status', 'updatedAt'],
    },
    access: {
        read: ({ req: { user } }) => {
            if (user) return true
            return {
                status: {
                    equals: 'published',
                },
            }
        },
    },
    hooks: {
        afterChange: [
            async ({ doc, operation }) => {
                if (operation !== 'create' && operation !== 'update') return doc
                try {
                    const { revalidatePath } = await import('next/cache')
                    revalidatePath('/changelog')
                } catch (err) {
                    console.warn(`[Changelog Hook:afterChange] Local revalidation skipped: ${err instanceof Error ? err.message : String(err)}`)
                }
                try {
                    const secret = process.env.REVALIDATE_SECRET
                    if (secret) {
                        await fetch('https://noe-shiftica.com/api/revalidate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ secret, collection: 'changelog' }),
                        })
                    }
                } catch (e) {
                    console.error('[Changelog Hook:afterChange] Revalidation request error:', e)
                }
                return doc
            },
        ],
        afterDelete: [
            async () => {
                try {
                    const { revalidatePath } = await import('next/cache')
                    revalidatePath('/changelog')
                } catch (err) {
                    console.warn(`[Changelog Hook:afterDelete] Local revalidation skipped: ${err instanceof Error ? err.message : String(err)}`)
                }
                try {
                    const secret = process.env.REVALIDATE_SECRET
                    if (secret) {
                        await fetch('https://noe-shiftica.com/api/revalidate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ secret, collection: 'changelog' }),
                        })
                    }
                } catch (e) {
                    console.error('[Changelog Hook:afterDelete] Revalidation request error:', e)
                }
            },
        ],
    },
    fields: [
        {
            name: 'version',
            type: 'text',
            admin: {
                position: 'sidebar',
                description: '例: "v1.2.0"（任意）',
            },
        },
        {
            name: 'date',
            type: 'date',
            required: true,
            admin: {
                position: 'sidebar',
                date: {
                    pickerAppearance: 'dayOnly',
                    displayFormat: 'yyyy-MM-dd',
                },
            },
        },
        {
            name: 'category',
            type: 'select',
            required: true,
            options: [
                { label: 'Added', value: 'Added' },
                { label: 'Changed', value: 'Changed' },
                { label: 'Fixed', value: 'Fixed' },
                { label: 'Removed', value: 'Removed' },
            ],
            admin: {
                description: 'Keep a Changelog 準拠のカテゴリ。',
            },
        },
        {
            name: 'changes',
            type: 'array',
            label: '変更点',
            labels: {
                singular: '変更点',
                plural: '変更点',
            },
            minRows: 1,
            fields: [
                {
                    name: 'text',
                    type: 'text',
                    required: true,
                },
            ],
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
    ],
}
