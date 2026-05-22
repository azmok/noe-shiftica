import { createServerFeature } from '@payloadcms/richtext-lexical'

export const MarkdownCopyFeature = createServerFeature({
    feature: {
        ClientFeature: '@/plugins/markdownCopyPlugin/client#MarkdownCopyClientFeature',
    },
    key: 'markdownCopy',
})
