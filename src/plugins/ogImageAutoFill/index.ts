import type { Plugin, CollectionBeforeChangeHook } from 'payload'

const FALLBACK_OG_IMAGE =
    'https://firebasestorage.googleapis.com/v0/b/noe-shiftica.firebasestorage.app/o/fallback-image.png?alt=media&token=731d39a7-d242-4ba5-b5c3-5fdf6695eb90'

const populateOgImage: CollectionBeforeChangeHook = async ({ data, req }) => {
    // Check if status is becoming "published"
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
                // Prefer the OG-optimized variant (1200x630); fall back to original
                data.ogImage = (mediaDoc.sizes as any)?.og?.url || mediaDoc.url || FALLBACK_OG_IMAGE;
            } else {
                data.ogImage = FALLBACK_OG_IMAGE;
            }
        } catch (e) {
            console.error('[ogImageAutoFillPlugin] error:', e);
        }
    }
    return data;
}

export const ogImageAutoFillPlugin = (options?: { collections?: string[] }): Plugin => {
    const targetCollections = options?.collections || ['posts', 'tech-posts'];

    return (config) => {
        config.collections = (config.collections || []).map((collection) => {
            if (targetCollections.includes(collection.slug)) {
                
                // Override the ogImage field to use the custom component
                collection.fields = collection.fields.map(field => {
                    if (field.type === 'text' && field.name === 'ogImage') {
                        return {
                            ...field,
                            admin: {
                                ...field.admin,
                                components: {
                                    ...(field.admin?.components || {}),
                                    Field: '/plugins/ogImageAutoFill/components/OgImageField#OgImageField'
                                }
                            }
                        }
                    }
                    return field;
                });

                // Add beforeChange hook
                collection.hooks = collection.hooks || {};
                collection.hooks.beforeChange = [
                    populateOgImage,
                    ...(collection.hooks.beforeChange || []),
                ];
            }
            return collection;
        });

        return config;
    };
}
