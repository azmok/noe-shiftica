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
  upload: {
    // Auto-generate resized variants via Sharp on every upload
    // These are stored in GCS alongside the original
    imageSizes: [
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
    adminThumbnail: 'thumbnail',
  },
}
