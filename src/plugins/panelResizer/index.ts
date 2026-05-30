import type { Plugin } from 'payload'

export const panelResizerPlugin = (): Plugin => {
  return (config) => {
    config.admin = config.admin || {}
    config.admin.components = config.admin.components || {}
    config.admin.components.providers = config.admin.components.providers || []

    const providerPath = '@/plugins/panelResizer/Provider#PanelResizerProvider'
    if (!config.admin.components.providers.includes(providerPath)) {
      config.admin.components.providers.push(providerPath)
    }

    return config
  }
}
