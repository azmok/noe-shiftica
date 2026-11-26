'use client'

import React from 'react'
import { Card } from '@payloadcms/ui'

/**
 * 管理画面のダッシュボードの先頭に「Markdown Post Manager」のカードを出す。
 * 見た目はコレクションのカードと同じ（Payload の Card と collections__* のクラスを使う）。
 */
export function DashboardCard() {
  return (
    <div className="collections" style={{ marginBottom: 'var(--base)' }}>
      <div className="collections__wrap">
        <div className="collections__group">
          <h2 className="collections__label">記事の管理</h2>
          <ul className="collections__card-list">
            <li>
              <Card
                href="/admin/markdown-post-manager"
                id="card-markdown-post-manager"
                title="📝 Markdown Post Manager"
                buttonAriaLabel="Markdown Post Manager を開く"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DashboardCard
