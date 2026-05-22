import type { Plugin, CollectionBeforeChangeHook } from 'payload'

const trackSlugHistory: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
    // Check if we have an existing document and the slug is being changed
    if (originalDoc && originalDoc.slug && data && data.slug && originalDoc.slug !== data.slug) {
        const history = originalDoc.slugHistory || [];
        
        // Avoid duplicate slug records in history
        const slugExists = history.some((h: any) => h.slug === originalDoc.slug);
        if (!slugExists) {
            data.slugHistory = [
                ...history,
                { slug: originalDoc.slug }
            ];
        }
    }
    return data;
}

export const slugTrackerPlugin = (options?: { collections?: string[] }): Plugin => {
    const targetCollections = options?.collections || ['posts', 'tech-posts'];

    return (config) => {
        config.collections = (config.collections || []).map((collection) => {
            if (targetCollections.includes(collection.slug)) {
                // 1. Inject slugHistory field
                collection.fields = [
                    ...collection.fields,
                    {
                        name: 'slugHistory',
                        type: 'array',
                        admin: {
                            position: 'sidebar',
                            readOnly: true,
                            description: '過去に使用されていたスラッグの履歴です（自動記録）。',
                        },
                        fields: [
                            {
                                name: 'slug',
                                type: 'text',
                                required: true,
                            }
                        ]
                    }
                ];

                // 2. Register hook to capture slug changes
                collection.hooks = collection.hooks || {};
                collection.hooks.beforeChange = [
                    trackSlugHistory,
                    ...(collection.hooks.beforeChange || []),
                ];
            }
            return collection;
        });

        return config;
    };
}
