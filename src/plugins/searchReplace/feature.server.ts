import { createServerFeature } from '@payloadcms/richtext-lexical'

export const SearchReplaceFeature = createServerFeature({
  feature: {
    // Client feature path mapping
    ClientFeature: '@/plugins/searchReplace/feature.client#SearchReplaceFeatureClient',
    nodes: [],
    i18n: {
      en: { label: { toolbar: 'Search & Replace' } },
      ja: { label: { toolbar: '検索・置換' } },
    },
  },
  key: 'searchReplace',
})
