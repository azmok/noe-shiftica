import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
    slug: 'categories',
    admin: {
        useAsTitle: 'name',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            validate: async (val: any, options: any) => {
                if (!val) return 'カテゴリ名は必須です'
                
                try {
                    const trimmedVal = val.trim()
                    if (trimmedVal === '') return 'カテゴリ名は必須です'

                    const { req, operation, id } = options
                    const existing = await req.payload.find({
                        collection: 'categories',
                        where: {
                            name: {
                                equals: trimmedVal,
                            },
                        },
                        depth: 0,
                        limit: 1,
                    })

                    if (existing.docs.length > 0) {
                        // If updating, ignore if it is the same document
                        if (operation === 'update' && existing.docs[0].id === id) {
                            return true
                        }
                        return 'このカテゴリ名は既に存在します'
                    }
                } catch (error) {
                    return 'カテゴリ名の重複判定中にエラーが発生しました'
                }
                
                return true
            },
        },
    ],
}
