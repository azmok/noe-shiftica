import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import { isHumanUser } from '../../api-clients/permissions'

/**
 * 管理画面のタブ「Markdown Post Manager」（/admin/markdown-post-manager）。
 * 公開前の記事（GitHub の非公開リポジトリにある .md）を、記事一覧・本番そっくりのプレビュー・
 * クリック編集・保存の結果つきで編集するアプリ（public/mpm-app/）を、管理画面の中に開く。
 * GitHub との通信は /api/mpm/github（サーバーが設定の鍵を付けて中継）を通る。
 */
export function ManagerView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  if (!isHumanUser(req.user)) redirect('/admin/login?redirect=' + encodeURIComponent('/admin/markdown-post-manager'))
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <div style={{ height: 'calc(100dvh - var(--app-header-height, 0px) - 8px)', minHeight: 520, padding: '0 var(--gutter-h, 24px) 8px' }}>
        <iframe
          src="/mpm-app/index.html"
          title="Markdown Post Manager"
          style={{ width: '100%', height: '100%', border: '1px solid var(--theme-elevation-150)', borderRadius: 8, background: '#0b0c10' }}
        />
      </div>
    </DefaultTemplate>
  )
}

export default ManagerView
