'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import {
  FontSizeToolbarItem,
  TextColorToolbarItem,
  TextGradientToolbarItem,
  ClearStyleToolbarItem,
} from './components/TextStyleToolbar'

export const TextStyleFeatureClient = createClientFeature({
  toolbarFixed: {
    groups: [
      {
        key: 'textStyleGroup',
        type: 'buttons',
        items: [
          {
            Component: FontSizeToolbarItem,
            key: 'fontSizeButton',
          },
          {
            Component: TextColorToolbarItem,
            key: 'textColorButton',
          },
          {
            Component: TextGradientToolbarItem,
            key: 'textGradientButton',
          },
          {
            Component: ClearStyleToolbarItem,
            key: 'clearStyleButton',
          },
        ],
      },
    ],
  },
})
