import type { CollectionConfig } from 'payload'
import { mediaSizeEndpoints } from './mediaEndpoints'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  endpoints: mediaSizeEndpoints,
  fields: [
    {
      // Override the auto-generated filename field's Cell component to use
      // AdminThumbnailCell, which implements the same dual-layer cache as GcsImage.
      // This eliminates the ShimmerEffect flash that Payload's default Thumbnail
      // component always shows — even for browser-cached images.
      name: 'filename',
      type: 'text',
      admin: {
        // Editing this directly would NOT move the underlying GCS objects, leaving
        // filename/URL out of sync. Use the rename UI below, which moves files too.
        readOnly: true,
      },
    },
    {
      name: 'renameManager',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/MediaRenameField#MediaRenameField',
        },
      },
    },
    {
      name: 'alt',

      type: 'text',
      admin: {
        components: {
          Field: '@/components/AltField#AltField',
        },
      },
    },
    {
      name: 'sizeManager',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/MediaSizeManager#MediaSizeManager',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data && (!data.alt || data.alt.trim() === '') && data.filename) {
          data.alt = data.filename
        }
        return data
      },
    ],
    afterRead: [
      ({ doc }) => {
        const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET || 'noe-shiftica.firebasestorage.app'
        const getDirectUrl = (filename: string) =>
          `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filename)}?alt=media&`

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
    // These are stored in GCS alongside the original.
    // Variants are encoded explicitly (formatOptions on EVERY size — Payload carries the
    // previous size's formatOptions forward otherwise). Before 2026-10 they kept the
    // upload's format, so PNG screenshots produced e.g. a 1 MB 1200px `og` PNG.
    // WebP q85 is visually lossless at these sizes; `og` stays JPEG because WebP OG
    // images are not reliably rendered by every SNS/messenger preview.
    imageSizes: [
      {
        name: 'adminList',
        width: 100,
        height: 100,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'adminPreview',
        width: 480,
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        // Blog list grid cards (4:3 aspect), small screens
        name: 'thumbnail',
        width: 400,
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        // Blog list view / sidebar images
        name: 'medium',
        width: 800,
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        // Featured posts, hero images (16:9-ish)
        name: 'large',
        width: 1920,
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        // OG image for social media (Twitter/X, Facebook, LINE) — recommended 1200×630
        name: 'og',
        width: 1200,
        formatOptions: { format: 'jpeg', options: { quality: 85, mozjpeg: true } },
      },
    ],
    // Allow Next.js Image optimization to work with GCS URLs
    adminThumbnail: 'adminList',
  },
}
