import type { Config, Plugin } from 'payload'

const FALLBACK_OG_IMAGE =
  'https://firebasestorage.googleapis.com/v0/b/noe-shiftica.firebasestorage.app/o/og-images%2Ffallback-image.png?alt=media&token=48aa4898-cdb2-4e26-8808-03339599c3c1'

interface OgImagePluginOptions {
  /** Payload collection slug to attach the hook to */
  collection: string
  /** Name of the relationship field pointing to the media collection */
  heroImageField: string
  /** Name of the string field to write the OG image URL into */
  ogImageField: string
}

export const ogImagePlugin =
  (options: OgImagePluginOptions): Plugin =>
  (incomingConfig: Config): Config => {
    const { collection, heroImageField, ogImageField } = options

    return {
      ...incomingConfig,
      collections: (incomingConfig.collections ?? []).map((col) => {
        if (col.slug !== collection) return col

        const existingHooks = col.hooks ?? {}
        const existingAfterChange = existingHooks.afterChange ?? []

        return {
          ...col,
          hooks: {
            ...existingHooks,
            afterChange: [
              ...existingAfterChange,
              async ({ doc, req, operation }) => {
                // Only run when a document is published
                if (doc.status !== 'published') return doc

                try {
                  // heroImage can be populated (object) or just an ID (string/number)
                  const heroImage = doc[heroImageField]
                  const ogUrl: string =
                    heroImage && typeof heroImage === 'object' && heroImage.url
                      ? (heroImage.url as string)
                      : FALLBACK_OG_IMAGE

                  // Write back only if the value has changed to avoid infinite loops
                  if (doc[ogImageField] !== ogUrl) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (req.payload as any).update({
                      collection,
                      id: doc.id,
                      data: { [ogImageField]: ogUrl },
                      depth: 0,
                      overrideAccess: true,
                    })

                    return { ...doc, [ogImageField]: ogUrl }
                  }
                } catch (err) {
                  console.error('[ogImagePlugin] Failed to set ogImage:', err)
                }

                return doc
              },
            ],
          },
        }
      }),
    }
  }
