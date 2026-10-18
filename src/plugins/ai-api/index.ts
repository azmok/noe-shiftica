import type { Plugin } from 'payload'
import { ApiLogs } from './collection'
import { aiPostsCreateHandler, aiPostsDeleteHandler } from './endpoints/posts'

/**
 * AI 記事 API プラグイン。
 *
 * 1. /api/ai/posts（POST: 記事の作成・更新・下書きの公開 / DELETE: 削除）を
 *    Payload のルートエンドポイントとして登録する。
 * 2. 呼び出しを記録する api-logs コレクション（一覧上部に API ガイド）を登録する。
 *
 * 認証と権限は api-clients プラグイン（外部AI連携）に従う。api-logs も権限ラップの
 * 対象にするため、plugins 配列では apiClientsPlugin() より前に置くこと。
 */
export const aiApiPlugin = (): Plugin => (config) => ({
  ...config,
  collections: [...(config.collections ?? []), ApiLogs],
  endpoints: [
    ...(config.endpoints ?? []),
    { path: '/ai/posts', method: 'post', handler: aiPostsCreateHandler },
    { path: '/ai/posts', method: 'delete', handler: aiPostsDeleteHandler },
  ],
})
