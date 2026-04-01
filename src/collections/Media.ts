import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      // Override the auto-generated filename field's Cell component to use
      // AdminThumbnailCell, which implements the same dual-layer cache as GcsImage.
      // This eliminates the ShimmerEffect flash that Payload's default Thumbnail
      // component always shows — even for browser-cached images.
      name: 'filename',
      type: 'text',
      admin: {
        components: {
          Cell: '@/components/AdminThumbnailCell#AdminThumbnailCell',
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  hooks: {
    afterRead: [
      ({ doc }) => {
        const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET || 'noe-shiftica.firebasestorage.app'
        const getDirectUrl = (filename: string) =>
          `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filename)}?alt=media`

        if (doc.filename) {
          doc.url = getDirectUrl(doc.filename)
        }

        if (doc.sizes) {
          Object.keys(doc.sizes).forEach((size) => {
            const sizeData = doc.sizes[size]
            if (sizeData && typeof sizeData === 'object' && sizeData.filename) {
              sizeData.url = getDirectUrl(sizeData.filename)
            }
          })
        }

        return doc
      },
    ],
  },
  upload: {
    // Auto-generate resized variants via Sharp on every upload
    // These are stored in GCS alongside the original
    imageSizes: [
      {
        name: 'adminList',
        width: 100,
        height: 100,
        position: 'centre',
      },
      {
        name: 'adminPreview',
        width: 480,
      },
      {
        // Blog list grid cards (4:3 aspect), small screens
        name: 'thumbnail',
        width: 400,
      },
      {
        // Blog list view / sidebar images
        name: 'medium',
        width: 800,
      },
      {
        // Featured posts, hero images (16:9-ish)
        name: 'large',
        width: 1920,
      },
      {
        // OG image for social media (Twitter/X, Facebook, LINE) — recommended 1200×630
        name: 'og',
        width: 1200,
      },
    ],
    // Allow Next.js Image optimization to work with GCS URLs
    adminThumbnail: 'adminList',
  },
}
