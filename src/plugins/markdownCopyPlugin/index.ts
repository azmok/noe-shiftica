import type { Plugin } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  FixedToolbarFeature,
  EXPERIMENTAL_TableFeature,
  HorizontalRuleFeature,
  BlocksFeature,
} from '@payloadcms/richtext-lexical'
import { MarkdownPasteFeature } from '../../features/markdownPaste/server'
import { HtmlSourceViewerFeature } from '../htmlSourceViewer/feature.server'
import { MarkdownCopyFeature } from './feature.server'
import { TextStyleFeature } from '../textStyle/feature.server'
import { CustomCodeBlock } from '../../features/customCodeBlock'

export const markdownCopyPlugin = (options?: { collections?: string[] }): Plugin => {
  const targetCollections = options?.collections || ['posts', 'tech-posts']

  return (config) => {
    config.collections = (config.collections || []).map((collection) => {
      if (targetCollections.includes(collection.slug)) {
        collection.fields = (collection.fields || []).map((field) => {
          if (field.type === 'richText' && field.name === 'content') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  FixedToolbarFeature(),
                  EXPERIMENTAL_TableFeature(),
                  MarkdownPasteFeature(),
                  MarkdownCopyFeature(),
                  HtmlSourceViewerFeature(),
                  TextStyleFeature(),
                  HorizontalRuleFeature(),
                  BlocksFeature({
                    blocks: [CustomCodeBlock],
                  }),
                ],
              }),
            }
          }
          return field
        })
      }
      return collection
    })

    return config
  }
}
