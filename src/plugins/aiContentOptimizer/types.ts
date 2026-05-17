export interface AiContentOptimizerOptions {
    /**
     * Optional: Enable/disable the optimizer for specific collections.
     * Defaults to ['posts'] if not provided.
     */
    collections?: string[]
}

export interface EnrichmentRequest {
    title: string
    content: any
    htmlContent?: string
    /**
     * Internal: Use mocked data for testing purposes to avoid real Gemini calls.
     * Only respected in non-production environments.
     */
    testMock?: boolean
    options?: {
        title?: boolean
        slug?: boolean
        description?: boolean
        categories?: boolean
        tags?: boolean
        seo?: boolean
    }
}
