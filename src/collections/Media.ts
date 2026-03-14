import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
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
            if (doc.sizes[size].filename) {
              doc.sizes[size].url = getDirectUrl(doc.sizes[size].filename)
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
        height: 360,
        position: 'centre',
      },
      {
        // Blog list grid cards (4:3 aspect), small screens
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        // Blog list view / sidebar images
        name: 'medium',
        width: 800,
        height: 600,
        position: 'centre',
      },
      {
        // Featured posts, hero images (16:9-ish)
        name: 'large',
        width: 1200,
        height: 800,
        position: 'centre',
      },
    ],
    // Allow Next.js Image optimization to work with GCS URLs
    adminThumbnail: 'adminList',
  },
}
