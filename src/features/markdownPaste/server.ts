import { createServerFeature } from '@payloadcms/richtext-lexical'

export const MarkdownPasteFeature = createServerFeature({
    feature: {
        ClientFeature: '@/features/markdownPaste/client#MarkdownPasteClientFeature',
    },
    key: 'markdownPaste',
})
