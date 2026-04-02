import { Plugin } from 'payload'
import { AiContentOptimizerOptions } from './types'
import { aiEnrichPostHandler } from './endpoints/aiEnrichPost'

/**
 * AI Content Optimizer Plugin
 * 
 * Automatically enriches blog post metadata (SEO, OG, Tags, Categories) 
 * using Gemini 2.5 Flash analysis of the content.
 */
export const aiContentOptimizerPlugin = (options?: AiContentOptimizerOptions): Plugin => {
    return (config) => {
        const collectionsToOptimize = options?.collections || ['posts']
        const existingEndpoints = config.endpoints || []

        // Register the AI enrichment endpoint
        config.endpoints = [
            ...existingEndpoints,
            {
                path: '/ai-enrich-post',
                method: 'post',
                handler: aiEnrichPostHandler,
            },
        ]

        // Inject UI into specified collections
        config.collections = (config.collections || []).map((collection) => {
            if (collectionsToOptimize.includes(collection.slug)) {
                collection.fields = [
                    {
                        name: 'aiContentOptimizerUI',
                        type: 'ui',
                        admin: {
                            position: 'sidebar',
                            components: {
                                // Points to the new component location
                                Field: '/plugins/aiContentOptimizer/components/AiContentOptimizerUI#AiContentOptimizerUI',
                            },
                        },
                    },
                    ...collection.fields,
                ]
            }
            return collection
        })

        return config
    }
}
