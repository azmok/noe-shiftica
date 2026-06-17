import type { Plugin } from 'payload'
import { HostedPagesCollection } from './collection'

/**
 * HTMLホスティングプラグイン。
 *
 * CSS/JS を含む HTML をアップロード、または Monaco エディタ（HTML/CSS/JS の3分割）で
 * 直接編集してホスティングするためのコレクションを登録する。
 * 公開ページは Route Handler `src/app/p/[slug]/route.ts` が /p/<slug> で配信する。
 */
export const htmlHostingPlugin = (): Plugin => (config) => {
  config.collections = [...(config.collections ?? []), HostedPagesCollection]
  return config
}
