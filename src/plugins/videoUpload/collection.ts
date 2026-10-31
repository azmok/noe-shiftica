import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

/** 動画 1 ファイルの上限（バイト）。ブラウザから GCS へ直接上げるので Cloud Run の上限は関係ない */
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024

/** 再生できる形式。H.264 の MP4 が最も互換性が高い */
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

type VideoData = { filename?: string; mimeType?: string; filesize?: number; alt?: string }

/** 直接アップロードはサーバーがファイル本体を見ないので、サイズと形式は保存時にメタデータで検証する */
export const validateVideo: CollectionBeforeChangeHook = ({ data }) => {
  const video = data as VideoData
  if (video.mimeType && !VIDEO_MIME_TYPES.includes(video.mimeType)) {
    throw new Error(`動画は ${VIDEO_MIME_TYPES.join(' / ')} のみアップロードできます（${video.mimeType}）`)
  }
  if (typeof video.filesize === 'number' && video.filesize > MAX_VIDEO_BYTES) {
    throw new Error(`動画は ${MAX_VIDEO_BYTES / 1024 / 1024} MB 以下にしてください（${Math.round(video.filesize / 1024 / 1024)} MB）`)
  }
  if ((!video.alt || video.alt.trim() === '') && video.filename) video.alt = video.filename
  return data
}

export const VideosCollection: CollectionConfig = {
  slug: 'videos',
  labels: { singular: '動画', plural: '動画' },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [{ name: 'alt', type: 'text', admin: { description: '空なら、ファイル名が入ります' } }],
  hooks: {
    beforeChange: [validateVideo],
    afterRead: [
      ({ doc }) => {
        // Media と同じく Firebase Storage の直リンクを返す（Range 対応なのでシーク・ストリーミング再生が効く）
        const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET || 'noe-shiftica.firebasestorage.app'
        if (doc.filename) {
          doc.url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(doc.filename)}?alt=media&`
        }
        return doc
      },
    ],
  },
  upload: {
    mimeTypes: VIDEO_MIME_TYPES,
  },
}
