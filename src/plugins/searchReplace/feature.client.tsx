'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { SearchReplaceToolbarItem } from './components/SearchReplaceToolbar'

// Registered ONLY on the fixed toolbar. The component mounts a single global
// Cmd/Ctrl+H keydown listener; registering it in the inline (hover) toolbar too
// would mount a second listener and make the shortcut double-toggle (no-op).
export const SearchReplaceFeatureClient = createClientFeature({
  toolbarFixed: {
    groups: [
      {
        key: 'searchReplaceGroup',
        type: 'buttons',
        items: [
          {
            Component: SearchReplaceToolbarItem,
            key: 'searchReplaceButton',
          },
        ],
      },
    ],
  },
})
