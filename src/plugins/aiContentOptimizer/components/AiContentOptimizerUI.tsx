'use client'

import React, { useState, useCallback } from 'react'
import { useForm, useField, useDocumentInfo } from '@payloadcms/ui'
import { DRAFT_SAVE_EVENT } from '../../shared/draftStorage'

export const AiContentOptimizerUI: React.FC = () => {
    const [isOptimizing, setIsOptimizing] = useState(false)

    const form = useForm()
    const dispatchFields = form?.dispatchFields
    const { id } = useDocumentInfo()

    const fieldTitle = useField<string>({ path: 'title' })
    const fieldContent = useField<any>({ path: 'content' })
    const fieldCustomMetaData = useField<Record<string, any>>({ path: 'customMetaData' })
    const fieldHtmlEmbed = useField<any>({ path: 'htmlEmbed' })

    const metaData = fieldCustomMetaData?.value || {}
    const hasHtmlEmbed = !!fieldHtmlEmbed?.value

    const handleAiOptimize = useCallback(async () => {
        const title = fieldTitle?.value
        const content = fieldContent?.value
        const currentMeta = fieldCustomMetaData?.value || {}
        const htmlEmbedValue = fieldHtmlEmbed?.value

        if (!title) {
            alert('Please enter a title first.')
            return
        }

        setIsOptimizing(true)
        console.group('[AI-OPTIMIZER] Optimizing...')

        try {
            let htmlContent = ''
            if (htmlEmbedValue) {
                if (typeof htmlEmbedValue === 'object' && htmlEmbedValue !== null && htmlEmbedValue.bodyHtml) {
                    htmlContent = htmlEmbedValue.bodyHtml
                    console.log('[AI-OPTIMIZER] Using bodyHtml from populated htmlEmbed object.')
                } else {
                    const embedId = typeof htmlEmbedValue === 'object' ? htmlEmbedValue.id : htmlEmbedValue
                    if (embedId) {
                        try {
                            const res = await fetch(`/api/html-files/${embedId}`)
                            if (res.ok) {
                                const doc = await res.json()
                                htmlContent = doc.bodyHtml || ''
                                console.log('[AI-OPTIMIZER] Fetched bodyHtml from /api/html-files/{id}.')
                            }
                        } catch (e) {
                            console.warn('[AI-OPTIMIZER] Could not fetch htmlEmbed content:', e)
                        }
                    }
                }
            }

            const response = await fetch('/api/ai-enrich-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, htmlContent }),
            })

            if (!response.ok) {
                const errText = await response.text().catch(() => '(unreadable)')
                throw new Error(`AI Enrichment failed: ${response.status} ${response.statusText} — ${errText}`)
            }

            const aiResult = await response.json()
            console.log('[AI-OPTIMIZER] AI Result received:', aiResult)

            if (dispatchFields) {
                const standardFields = ['title', 'slug', 'description', 'categories', 'publishedAt', 'content', 'coverImage', 'heroImage']
                const nextCustomMeta = { ...currentMeta }

                Object.entries(aiResult).forEach(([key, value]) => {
                    if (key === 'updatedAt') return
                    if (standardFields.includes(key)) {
                        dispatchFields({ type: 'UPDATE', path: key, value })
                    } else {
                        nextCustomMeta[key] = value
                    }
                })

                dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: nextCustomMeta })

                if (form?.setModified) {
                    form.setModified(true)
                }
            }

            console.log('[AI-OPTIMIZER] Optimization complete.')
            // レンダリングが落ち着いてから autosave プラグインに保存を依頼
            if (!id) {
                setTimeout(() => window.dispatchEvent(new CustomEvent(DRAFT_SAVE_EVENT)), 500)
            }
        } catch (error) {
            console.error('[AI-OPTIMIZER] Optimization failed:', error)
            alert('AI Optimization failed.')
        } finally {
            setIsOptimizing(false)
            console.groupEnd()
        }
    }, [fieldTitle?.value, fieldContent?.value, fieldCustomMetaData?.value, fieldHtmlEmbed?.value, dispatchFields, form, id])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 0.5rem 1rem' }}>
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleAiOptimize() }}
                disabled={isOptimizing}
                className="btn btn--style-primary btn--size-small"
                style={{ width: '100%' }}
            >
                {isOptimizing
                    ? 'Optimizing...'
                    : hasHtmlEmbed
                        ? '✨ AI Optimizer (HTML Import)'
                        : '✨ AI Content Optimizer'
                }
            </button>

            {hasHtmlEmbed && (
                <p style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: '-0.25rem', fontWeight: '600' }}>
                    📎 HTMLインポートを検出 — インポートの内容を分析してメタデータを生成します
                </p>
            )}

            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                Import first, then optimize. Remember to check AI suggestions before publishing.
            </p>

            {/* Metadata Preview */}
            <div style={{
                marginTop: '1rem',
                borderTop: '1px solid #eee',
                paddingTop: '1rem',
                backgroundColor: '#f9fafb',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
            }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span role="img" aria-label="meta">🏷️</span> Metadata Preview
                </h4>
                {Object.entries(metaData).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {Object.entries(metaData).map(([key, value]) => (
                            <div key={key} style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                                <span style={{ fontWeight: '600', color: '#4b5563', textTransform: 'capitalize' }}>{key}:</span>
                                <div style={{
                                    paddingLeft: '0.5rem',
                                    borderLeft: '2px solid #d1d5db',
                                    color: '#1f2937',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.4'
                                }}>
                                    {Array.isArray(value) ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                            {value.map((v, i) => (
                                                <span key={i} style={{
                                                    backgroundColor: '#e5e7eb',
                                                    padding: '1px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem'
                                                }}>{String(v)}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        String(value)
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '0.75rem', color: '#9ba3af', fontStyle: 'italic' }}>No custom metadata found.</p>
                )}
            </div>
        </div>
    )
}

export default AiContentOptimizerUI
