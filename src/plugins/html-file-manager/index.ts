import type { Plugin } from 'payload'
import { HtmlFilesCollection } from './collection'

// Plugin display name: HTMLFileImporter&Manager
// Directory uses kebab-case (html-file-manager) to avoid '&' in filesystem paths.
export const htmlFileManagerPlugin = (): Plugin => (config) => {
  // Register collection
  config.collections = [...(config.collections ?? []), HtmlFilesCollection]

  // Inject admin custom view for live preview (Pattern 2)
  // Route: /admin/html-files-preview?id=:id
  // Replaces the old frontend route /html-files/[id]/preview
  config.admin = config.admin ?? {}
  config.admin.components = config.admin.components ?? {}
  config.admin.components.views = {
    ...(config.admin.components.views ?? {}),
    htmlFilesPreview: {
      Component: '@/plugins/html-file-manager/views/PreviewView#PreviewView',
      path: '/html-files-preview',
    },
  }

  return config
}
