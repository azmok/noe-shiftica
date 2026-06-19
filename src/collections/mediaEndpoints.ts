import { Endpoint } from 'payload'

const getStorageInstance = () => {
  const { Storage } = require('@google-cloud/storage')
  const bucketName = process.env.GCS_BUCKET || (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).storageBucket : 'noe-shiftica.firebasestorage.app')
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID || (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : 'noe-shiftica'),
    ...(process.env.GCS_KEYFILE_PATH ? { keyFilename: process.env.GCS_KEYFILE_PATH } : {}),
  })
  return { storage, bucketName }
}

/**
 * Remove characters that are unsafe for object names / URLs, collapse whitespace
 * to hyphens, and strip leading dots. Unicode letters (e.g. 日本語) are preserved.
 */
const sanitizeBaseName = (raw: string): string =>
  raw
    .normalize('NFC')
    .replace(/[\/\\:*?"<>|\x00-\x1f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^\.+/, '')
    .trim()

export const mediaSizeEndpoints: Endpoint[] = [
  {
    // Rename a media file: moves the original AND every generated size variant in
    // GCS (copy + delete), then updates the document's filename/sizes metadata so
    // the derived URLs stay consistent. References from posts are by document ID,
    // so they are unaffected by the rename.
    path: '/:id/rename',
    method: 'post',
    handler: async (req) => {
      if (!req.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { id } = req.routeParams as { id: string }

      let body: { name?: string } = {}
      try {
        body = await (req as unknown as Request).json()
      } catch {
        // ignore — handled by the empty-name check below
      }

      try {
        const doc = await req.payload.findByID({ collection: 'media', id })
        if (!doc || !doc.filename) {
          return Response.json({ error: 'Not found' }, { status: 404 })
        }

        const oldFilename = doc.filename as string
        const dotIdx = oldFilename.lastIndexOf('.')
        const ext = dotIdx >= 0 ? oldFilename.slice(dotIdx) : ''
        const oldBase = dotIdx >= 0 ? oldFilename.slice(0, dotIdx) : oldFilename

        let newBase = sanitizeBaseName(body.name ?? '')
        // If the user typed the extension too, drop it — we always reattach the original.
        if (ext && newBase.toLowerCase().endsWith(ext.toLowerCase())) {
          newBase = newBase.slice(0, -ext.length)
        }
        if (!newBase) {
          return Response.json({ error: 'ファイル名が空です' }, { status: 400 })
        }

        const newFilename = `${newBase}${ext}`
        if (newFilename === oldFilename) {
          return Response.json({ filename: oldFilename, sizes: doc.sizes, url: doc.url })
        }

        // Collision check against other media documents.
        const existing = await req.payload.find({
          collection: 'media',
          where: { filename: { equals: newFilename } },
          limit: 1,
        })
        if (existing.docs.some((d) => String(d.id) !== String(id))) {
          return Response.json(
            { error: `「${newFilename}」は既に使用されています` },
            { status: 409 },
          )
        }

        const { storage, bucketName } = getStorageInstance()
        const bucket = storage.bucket(bucketName)

        // Collision check against the bucket itself.
        const [mainExists] = await bucket.file(newFilename).exists()
        if (mainExists) {
          return Response.json(
            { error: `ストレージに「${newFilename}」が既に存在します` },
            { status: 409 },
          )
        }

        // 1. Move the original file.
        await bucket.file(oldFilename).move(newFilename)

        // 2. Move each generated size variant, deriving its new name from the new base.
        const sizes = (doc.sizes as Record<string, any>) || {}
        const newSizes: Record<string, any> = { ...sizes }
        for (const [sizeName, sizeData] of Object.entries(sizes)) {
          const sizeFilename: string | undefined = sizeData?.filename
          if (!sizeFilename) continue
          // Size filenames are prefixed with the base name (e.g. "photo-100x100.webp").
          const newSizeFilename = sizeFilename.startsWith(oldBase)
            ? `${newBase}${sizeFilename.slice(oldBase.length)}`
            : sizeFilename
          if (newSizeFilename !== sizeFilename) {
            try {
              await bucket.file(sizeFilename).move(newSizeFilename)
            } catch (gcsErr) {
              console.error(`Failed to move size ${sizeFilename} → ${newSizeFilename}:`, gcsErr)
            }
          }
          newSizes[sizeName] = { ...sizeData, filename: newSizeFilename }
        }

        // 3. Persist the new filename + sizes metadata.
        const updated = await req.payload.update({
          collection: 'media',
          id,
          data: {
            filename: newFilename,
            sizes: newSizes,
          },
        })

        return Response.json({
          filename: newFilename,
          sizes: updated.sizes,
          url: updated.url,
        })
      } catch (err: any) {
        console.error('Error renaming media file:', err)
        return Response.json({ error: err.message }, { status: 500 })
      }
    },
  },
  {
    path: '/:id/sizes/:sizeName',
    method: 'delete',
    handler: async (req) => {
      if (!req.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { id, sizeName } = req.routeParams as { id: string; sizeName: string }

      try {
        const doc = await req.payload.findByID({
          collection: 'media',
          id,
        })

        if (!doc) {
          return Response.json({ error: 'Not found' }, { status: 404 })
        }

        const sizes = (doc.sizes as Record<string, any>) || {}
        const sizeData = sizes[sizeName]
        if (!sizeData || !sizeData.filename) {
          return Response.json({ error: 'Size not found on document' }, { status: 404 })
        }

        const { storage, bucketName } = getStorageInstance()

        // 1. Delete file from GCS
        try {
          await storage.bucket(bucketName).file(sizeData.filename).delete()
        } catch (gcsError: any) {
          console.error(`Failed to delete ${sizeData.filename} from GCS:`, gcsError)
        }

        // 2. Remove size from doc metadata
        const newSizes = { ...sizes }
        delete newSizes[sizeName]

        await req.payload.update({
          collection: 'media',
          id,
          data: {
            sizes: newSizes,
          },
        })

        return Response.json({ success: true })
      } catch (err: any) {
        console.error('Error deleting media size:', err)
        return Response.json({ error: err.message }, { status: 500 })
      }
    },
  },
  {
    path: '/:id/sizes/:sizeName',
    method: 'post',
    handler: async (req) => {
      if (!req.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { id, sizeName } = req.routeParams as { id: string; sizeName: string }

      try {
        const doc = await req.payload.findByID({
          collection: 'media',
          id,
        })

        if (!doc) {
          return Response.json({ error: 'Not found' }, { status: 404 })
        }

        let fileBuffer: Buffer | null = null;
        let mimeType = 'image/webp';
        
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            const formData = await (req as unknown as Request).formData();
            const file = formData.get('file');
            if (file instanceof Blob) {
               mimeType = file.type;
               const arrayBuffer = await file.arrayBuffer();
               fileBuffer = Buffer.from(arrayBuffer);
            }
        }

        if (!fileBuffer) {
          return Response.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const sizes = (doc.sizes as Record<string, any>) || {}
        const sizeData = sizes[sizeName]
        
        const originalNameParts = doc.filename!.split('.')
        originalNameParts.pop()
        const nameWithoutExt = originalNameParts.join('.')
        
        const filename = sizeData?.filename || `${nameWithoutExt}-${sizeName}.webp`

        const { storage, bucketName } = getStorageInstance()

        // 1. Upload to GCS
        const file = storage.bucket(bucketName).file(filename)
        await file.save(fileBuffer, {
            contentType: mimeType,
            resumable: false,
        })

        let width = sizeData?.width || null;
        let height = sizeData?.height || null;
        
        try {
            const sharp = require('sharp');
            const metadata = await sharp(fileBuffer).metadata();
            if (metadata.width) width = metadata.width;
            if (metadata.height) height = metadata.height;
        } catch (e) {
            console.error('Could not get image dimensions:', e);
        }

        const newSizeData = {
          ...sizeData,
          filename,
          filesize: fileBuffer.length,
          width,
          height,
          mimeType,
        }

        // 2. Update doc metadata
        const newSizes = {
          ...sizes,
          [sizeName]: newSizeData,
        }

        await req.payload.update({
          collection: 'media',
          id,
          data: {
            sizes: newSizes,
          },
        })

        const getDirectUrl = (fname: string) => `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fname)}?alt=media`
        newSizeData.url = getDirectUrl(filename)

        return Response.json(newSizeData)
      } catch (err: any) {
        console.error('Error updating media size:', err)
        return Response.json({ error: err.message }, { status: 500 })
      }
    },
  },
]
