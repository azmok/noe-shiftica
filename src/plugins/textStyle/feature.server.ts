import { createServerFeature } from '@payloadcms/richtext-lexical'

export const TextStyleFeature = createServerFeature({
  feature: {
    // Client feature path mapping
    ClientFeature: '@/plugins/textStyle/feature.client#TextStyleFeatureClient',
    nodes: [],
    i18n: {
      en: { label: { toolbar: 'Text Style' } },
      ja: { label: { toolbar: 'テキスト装飾' } },
    },
  },
  key: 'textStyle',
})
