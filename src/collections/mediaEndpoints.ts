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

export const mediaSizeEndpoints: Endpoint[] = [
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
