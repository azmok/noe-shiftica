import { createServerFeature } from '@payloadcms/richtext-lexical'

export const MarkdownCopyFeature = createServerFeature({
    feature: {
        ClientFeature: '@/features/markdownCopy/client#MarkdownCopyClientFeature',
    },
    key: 'markdownCopy',
})
