'use client'

import React, { useState } from 'react'

export const ApiEndpointGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'post' | 'delete' | 'auth'>('overview')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(true)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Determine current origin on client
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const endpointUrl = `${origin}/api/ai/posts`

  const samplePostCurl = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_AI_API_KEY" \\
  -d '{
    "title": "AIが生成した記事タイトル",
    "markdown": "# はじめに\\n\\nAIから自動投稿されたMarkdown本文です。\\n\\n\`\`\`javascript\\nconsole.log(\\"Hello Noe Shiftica\\");\\n\`\`\`",
    "status": "draft",
    "description": "記事の抜粋・メタ説明文"
  }'`

  const samplePostJson = JSON.stringify(
    {
      title: 'AIが生成した記事タイトル',
      markdown: '# はじめに\n\nAIから自動投稿されたMarkdown本文です。\n\n```javascript\nconsole.log("Hello Noe Shiftica");\n```',
      slug: 'ai-generated-post-sample',
      status: 'draft',
      collection: 'posts',
      description: '記事の抜粋・メタ説明文',
      tags: ['AI', 'Tech'],
    },
    null,
    2
  )

  const sampleDeleteCurl = `curl -X DELETE "${endpointUrl}?slug=ai-generated-post-sample" \\
  -H "x-api-key: YOUR_AI_API_KEY"`

  return (
    <div
      style={{
        margin: '16px 0 24px 0',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'var(--theme-elevation-50, #18181b)',
        color: 'var(--theme-text, #f4f4f5)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}
    >
      {/* Header bar with toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
            AI 連携 API エンドポイント利用ガイド
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(204, 221, 0, 0.15)',
              color: '#ccdd00',
              fontWeight: 600,
              border: '1px solid rgba(204, 221, 0, 0.3)',
            }}
          >
            ACTIVE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
          <span>{isOpen ? '折りたたむ' : 'ガイドを表示'}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '16px 18px' }}>
          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '10px',
              marginBottom: '16px',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'overview', label: '📋 エンドポイント概要' },
              { id: 'post', label: '📝 記事投稿 (POST)' },
              { id: 'delete', label: '🗑️ 記事削除 (DELETE)' },
              { id: 'auth', label: '🔑 認証とキー設定' },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? '#ccdd00' : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? '#000' : 'inherit',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', opacity: 0.85, lineHeight: 1.6 }}>
                外部の AI（Claude, ChatGPT, Dify, 自前スクリプト等）から本 CMS へ記事を直接投稿・削除するための専用エンドポイントです。
                送信された Markdown は自動で Payload の Lexical AST 形式へ変換され、即座に反映されます。
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>
                  エンドポイント URL
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>{endpointUrl}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(endpointUrl, 'endpoint')}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'inherit',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey === 'endpoint' ? '✓ コピー済み' : 'コピー'}
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'rgba(204, 221, 0, 0.05)',
                  border: '1px solid rgba(204, 221, 0, 0.2)',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: '#ccdd00' }}>⚡ 主な特徴:</strong>
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  <li><strong>Markdown 自動パース:</strong> コードブロックや SVG シンボル、raw HTML も崩さずに Lexical AST に自動変換。</li>
                  <li><strong>自動キャッシュ破棄:</strong> 記事作成/削除時にフロントエンドおよび本番 CDN キャッシュが自動再生成されます。</li>
                  <li><strong>完全ログ記録:</strong> すべての実行結果（成功/エラー）は下記テーブル「AI API Logs」へリアルタイムに記録されます。</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: POST */}
          {activeTab === 'post' && (
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', opacity: 0.85 }}>
                <code>POST /api/ai/posts</code> - 新規記事を作成、または既存スラッグの記事を更新します。
              </p>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', opacity: 0.6 }}>リクエスト JSON サンプル</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(samplePostJson, 'post-json')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'inherit',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey === 'post-json' ? '✓ コピー済み' : 'JSON をコピー'}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.8rem',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {samplePostJson}
                </pre>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', opacity: 0.6 }}>cURL コマンド例</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(samplePostCurl, 'post-curl')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'inherit',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey === 'post-curl' ? '✓ コピー済み' : 'cURL をコピー'}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.78rem',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {samplePostCurl}
                </pre>
              </div>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  marginTop: '8px',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>フィールド</th>
                    <th style={{ padding: '6px 8px' }}>型</th>
                    <th style={{ padding: '6px 8px' }}>必須</th>
                    <th style={{ padding: '6px 8px' }}>説明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>title</td>
                    <td style={{ padding: '6px 8px' }}>string</td>
                    <td style={{ padding: '6px 8px', color: '#ff7b72' }}>必須</td>
                    <td style={{ padding: '6px 8px' }}>記事のタイトル</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>markdown</td>
                    <td style={{ padding: '6px 8px' }}>string</td>
                    <td style={{ padding: '6px 8px', color: '#ff7b72' }}>必須</td>
                    <td style={{ padding: '6px 8px' }}>記事の本文（Markdown形式）</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>slug</td>
                    <td style={{ padding: '6px 8px' }}>string</td>
                    <td style={{ padding: '6px 8px', opacity: 0.6 }}>任意</td>
                    <td style={{ padding: '6px 8px' }}>URLスラッグ（省略時はタイトルから英訳自動生成）</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>status</td>
                    <td style={{ padding: '6px 8px' }}>string</td>
                    <td style={{ padding: '6px 8px', opacity: 0.6 }}>任意</td>
                    <td style={{ padding: '6px 8px' }}>"draft" または "published"（既定: draft）</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>description</td>
                    <td style={{ padding: '6px 8px' }}>string</td>
                    <td style={{ padding: '6px 8px', opacity: 0.6 }}>任意</td>
                    <td style={{ padding: '6px 8px' }}>記事概要・SEOメタディスクリプション</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>collection</td>
                    <td style={{ padding: '6px 8px' }}>string</td>
                    <td style={{ padding: '6px 8px', opacity: 0.6 }}>任意</td>
                    <td style={{ padding: '6px 8px' }}>"posts" または "tech-posts"（既定: posts）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: DELETE */}
          {activeTab === 'delete' && (
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', opacity: 0.85 }}>
                <code>DELETE /api/ai/posts?slug=xxx</code> または <code>?id=xxx</code> - 指定した記事を安全に削除します。
              </p>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', opacity: 0.6 }}>cURL コマンド例</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sampleDeleteCurl, 'delete-curl')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'inherit',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey === 'delete-curl' ? '✓ コピー済み' : 'cURL をコピー'}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.8rem',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {sampleDeleteCurl}
                </pre>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: '#ef4444' }}>⚠️ 削除時の注意:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  記事を削除すると、Neon DB からデータが物理削除され、キャッシュが即時破棄されます。
                  実行ログは「AI API Logs」テーブルに記録されるため、誰がいつ削除したかは後から追跡可能です。
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: AUTH */}
          {activeTab === 'auth' && (
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', opacity: 0.85, lineHeight: 1.6 }}>
                API へのリクエストは、リクエストヘッダーに API キーを付与して認証します。
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', opacity: 0.6, marginBottom: '4px' }}>
                  対応ヘッダー形式（いずれか1つを指定）
                </label>
                <pre
                  style={{
                    margin: 0,
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                  }}
                >
                  x-api-key: YOUR_AI_API_KEY{'\n'}
                  Authorization: Bearer YOUR_AI_API_KEY{'\n'}
                  Authorization: api-clients API-Key YOUR_AI_API_KEY
                </pre>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                }}
              >
                <strong>⚙️ キーの発行と権限:</strong>
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  <li>
                    <code>設定 → 外部AI連携</code> で AI ごとにエントリを作り、「Enable API Key」でキーを発行します。
                  </li>
                  <li>
                    作成・編集・削除・公開は、そのエントリのチェックボックスで許可したものだけ実行できます（足りないと <code>403</code>）。
                    「公開」が OFF のときは <code>status: &quot;draft&quot;</code> でしか保存できません。
                  </li>
                  <li>「有効」を OFF にするか、キーを再発行すると、古いキーはすぐ使えなくなります。</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
