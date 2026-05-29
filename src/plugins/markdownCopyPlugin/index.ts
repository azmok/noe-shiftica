import type { Plugin } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  FixedToolbarFeature,
  EXPERIMENTAL_TableFeature,
  HorizontalRuleFeature
} from '@payloadcms/richtext-lexical'
import { MarkdownPasteFeature } from '../../features/markdownPaste/server'
import { HtmlSourceFeature } from '../htmlSource/feature.server'
import { MarkdownCopyFeature } from './feature.server'

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
                  HtmlSourceFeature(),
                  HorizontalRuleFeature(),
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
