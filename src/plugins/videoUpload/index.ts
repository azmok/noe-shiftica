import type { Plugin } from 'payload'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { VideosCollection } from './collection'

/**
 * 動画専用の `videos` コレクションと、ブラウザ → GCS の直接アップロード（clientUploads）。
 *
 * 画像用の `media` は sharp でリサイズ版（WebP / og）を作るのでサーバーを通す必要がある。
 * 直接アップロードはサーバーを通らず、リサイズも走らない。そのため動画だけ別コレクションに分けた。
 * gcsStorage は複数回登録できるので、media / html-files 用の登録とは別にここで登録する。
 */
export const videoUploadPlugin = (): Plugin => (config) =>
  gcsStorage({
    collections: { videos: true },
    clientUploads: true,
    bucket:
      process.env.GCS_BUCKET ||
      (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).storageBucket : 'noe-shiftica.firebasestorage.app'),
    options: {
      projectId:
        process.env.GCS_PROJECT_ID ||
        (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : 'noe-shiftica'),
      ...(process.env.GCS_KEYFILE_PATH ? { keyFilename: process.env.GCS_KEYFILE_PATH } : {}),
    },
  })({ ...config, collections: [...(config.collections ?? []), VideosCollection] })
