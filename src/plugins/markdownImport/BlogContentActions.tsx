'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useForm, useField, useDocumentInfo } from '@payloadcms/ui'

const KNOWN_FIELDS = ['title', 'slug', 'publishedAt', 'content', 'description']

export const BlogContentActions: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [isOptimizing, setIsOptimizing] = useState(false)

    // Form mechanics
    const form = useForm()
    const dispatchFields = form?.dispatchFields

    // Field handles
    const fieldTitle = useField<string>({ path: 'title' })
    const fieldContent = useField<any>({ path: 'content' })
    const fieldCustomMetaData = useField<Record<string, any>>({ path: 'customMetaData' })

    const metaData = fieldCustomMetaData?.value || {}
    const { id } = useDocumentInfo()

    // --- Autosave Logic (LocalStorage) ---
    const DRAFT_KEY = 'payload-draft-post-new'

    const saveDraftToStorage = useCallback(() => {
        if (id || !form) return // すでに保存済み(idあり)の場合はキャッシュしない

        // form.getData() はフォーム全体の状態を取得
        const data = form.getData()
        const draft = {
            title: data.title,
            slug: data.slug,
            description: data.description,
            publishedAt: data.publishedAt,
            customMetaData: data.customMetaData,
            content: data.content,
        }

        // 何か入力があれば保存
        if (draft.title || draft.content || draft.description) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
        }
    }, [id, form])

    const hasRestored = useRef(false)

    // 新規作成時のみ：ローカルキャッシュから復元する
    useEffect(() => {
        if (id || hasRestored.current) return

        const savedDraft = localStorage.getItem(DRAFT_KEY)
        if (savedDraft && dispatchFields) {
            hasRestored.current = true
            try {
                const draft = JSON.parse(savedDraft)
                console.log('[BLOG-ACTIONS] Restoring local draft...')

                // Lexicalエディター等のマウントを待つため少し遅延させる
                setTimeout(() => {
                    Object.entries(draft).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            dispatchFields({
                                type: 'UPDATE',
                                path: key,
                                value: value
                            })
                        }
                    })
                    if (form?.setModified) {
                        form.setModified(true)
                    }
                }, 800)
            } catch (e) {
                console.error('[BLOG-ACTIONS] Restore failed:', e)
            }
        }
    }, [id, dispatchFields, form])

    // 保存やPublish時（idが新しく付与された時）にキャッシュを完全にクリア
    useEffect(() => {
        if (id) {
            const exists = localStorage.getItem(DRAFT_KEY)
            if (exists) {
                localStorage.removeItem(DRAFT_KEY)
                console.log('[BLOG-ACTIONS] Local draft cleared (Post saved/published).')
            }
        }
    }, [id])

    // タイピング時の自動保存 (Keyup Event)
    useEffect(() => {
        if (id) return

        let timer: NodeJS.Timeout
        const handleKeyUp = () => {
            clearTimeout(timer)
            timer = setTimeout(() => {
                saveDraftToStorage()
            }, 1000)
        }

        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keyup', handleKeyUp)
            clearTimeout(timer)
        }
    }, [id, saveDraftToStorage])

    const contentToSlug = useCallback(async (title: string) => {
        try {
            const res = await fetch(`/api/translate-slug?title=${encodeURIComponent(title)}`)
            if (res.ok) {
                const { slug } = await res.json()
                return slug
            }
        } catch (e) {
            console.error('[BLOG-ACTIONS] Slug translation failed', e)
        }
        return ''
    }, [])

    // --- Action 1: Markdown Import ---
    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        console.group('[BLOG-ACTIONS] Importing Markdown:', file.name)

        try {
            const text = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve(e.target?.result as string)
                reader.onerror = (e) => reject(new Error('FileReader failed'))
                reader.readAsText(file, 'UTF-8')
            })

            const response = await fetch('/api/convert-markdown', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: text,
            })

            if (!response.ok) throw new Error(`API error: ${response.statusText}`)

            const { frontmatter, lexical } = await response.json()

            // 1. CLEAR EXISTING CONTENT (Requirement: clear EVERYTHING first)
            console.log('[BLOG-ACTIONS] Clearing all existing fields...')
            if (dispatchFields) {
                dispatchFields({ type: 'UPDATE', path: 'title', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'slug', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'publishedAt', value: null })
                dispatchFields({ type: 'UPDATE', path: 'description', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: {} })
                dispatchFields({ type: 'UPDATE', path: 'content', value: null, initialValue: null })
            }

            // Small delay to ensure state clears
            await new Promise(resolve => setTimeout(resolve, 150));

            const customMetaData: Record<string, any> = {}
            Object.keys(frontmatter).forEach((key) => {
                if (!KNOWN_FIELDS.includes(key) && key !== 'date') {
                    customMetaData[key] = frontmatter[key]
                }
            })

            if (dispatchFields) {
                // Update Title
                dispatchFields({ type: 'UPDATE', path: 'title', value: frontmatter.title || '' })

                // Update Slug (Translate if title exists)
                if (frontmatter.title) {
                    const slug = await contentToSlug(frontmatter.title)
                    dispatchFields({ type: 'UPDATE', path: 'slug', value: slug })
                }

                // Update PublishedAt
                const dateStr = frontmatter.date || frontmatter.publishedAt
                if (dateStr) {
                    const parsedDate = new Date(dateStr)
                    if (!isNaN(parsedDate.getTime())) {
                        dispatchFields({ type: 'UPDATE', path: 'publishedAt', value: parsedDate.toISOString() })
                    }
                }

                // Update Description if it exists in frontmatter
                if (frontmatter.description) {
                    dispatchFields({ type: 'UPDATE', path: 'description', value: frontmatter.description })
                }

                // Update Custom Meta Data
                dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: customMetaData })

                // Update Content (Lexical)
                if (lexical) {
                    dispatchFields({
                        type: 'UPDATE',
                        path: 'content',
                        value: lexical,
                        initialValue: lexical,
                    })
                }
                // Mark form as modified to enable Save/Publish buttons
                if (form?.setModified) {
                    form.setModified(true)
                }
            }
            console.log('[BLOG-ACTIONS] Markdown import complete.')

            // --- インポート直後にAutosave ---
            setTimeout(() => {
                saveDraftToStorage()
            }, 500)
        } catch (error) {
            console.error('[BLOG-ACTIONS] Import failed:', error)
            alert('Failed to import Markdown.')
        } finally {
            setIsImporting(false)
            console.groupEnd()
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }, [dispatchFields, contentToSlug])

    // --- Action 2: AI Optimization ---
    const handleAiOptimize = useCallback(async () => {
        const title = fieldTitle?.value
        const content = fieldContent?.value
        const currentMeta = fieldCustomMetaData?.value || {}

        if (!title) {
            alert('Please enter a title first.')
            return
        }

        setIsOptimizing(true)
        console.group('[BLOG-ACTIONS] AI Optimizing...')

        try {
            const response = await fetch('/api/ai-enrich-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            })

            if (!response.ok) throw new Error('AI Enrichment failed')

            const aiResult = await response.json()
            console.log('[BLOG-ACTIONS] AI Result received:', aiResult)

            if (dispatchFields) {
                // Relationship fields (author) are excluded here because AI returns names/strings 
                // but Payload expects IDs. categories are now resolved to IDs on the backend.
                const standardFields = ['title', 'slug', 'description', 'categories', 'publishedAt', 'content', 'coverImage', 'heroImage']
                const nextCustomMeta = { ...currentMeta }

                Object.entries(aiResult).forEach(([key, value]) => {
                    if (key === 'updatedAt') {
                        console.log(`[BLOG-ACTIONS] Skipping manual updatedAt: ${value}`)
                        return
                    }

                    if (standardFields.includes(key)) {
                        console.log(`[BLOG-ACTIONS] Mapping "${key}" to standard Field. value:`, value)
                        dispatchFields({ type: 'UPDATE', path: key, value })
                    } else {
                        console.log(`[BLOG-ACTIONS] Mapping "${key}" to customMetaData bucket. value:`, value)
                        nextCustomMeta[key] = value
                    }
                })

                console.log('[BLOG-ACTIONS] Merged customMetaData:', nextCustomMeta)

                // Update Custom Meta Data with merged values
                dispatchFields({
                    type: 'UPDATE',
                    path: 'customMetaData',
                    value: nextCustomMeta
                })
                // Mark form as modified to enable Save/Publish buttons
                if (form?.setModified) {
                    form.setModified(true)
                }
            }
            console.log('[BLOG-ACTIONS] AI optimization complete.')

            // --- AI最適化直後にAutosave ---
            setTimeout(() => {
                saveDraftToStorage()
            }, 500)
        } catch (error) {
            console.error('[BLOG-ACTIONS] AI Optimization failed:', error)
            alert('AI Optimization failed.')
        } finally {
            setIsOptimizing(false)
            console.groupEnd()
        }
    }, [fieldTitle?.value, fieldContent?.value, fieldCustomMetaData?.value, dispatchFields])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 0.5rem 1rem' }}>
            <input
                type="file"
                accept=".md"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {/* Button 1: Import */}
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                disabled={isImporting || isOptimizing}
                className="btn btn--style-secondary btn--size-small"
                style={{ width: '100%' }}
            >
                {isImporting ? 'Importing...' : '📄 Markdown Importer'}
            </button>

            {/* Button 2: AI Optimize */}
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleAiOptimize(); }}
                disabled={isImporting || isOptimizing}
                className="btn btn--style-primary btn--size-small"
                style={{ width: '100%' }}
            >
                {isOptimizing ? 'Optimizing...' : '✨ AI Content Optimizer'}
            </button>

            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                Import first, then optimize. Remember to check AI suggestions before publishing.
            </p>

            {/* Metadata Preview Section */}
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

export default BlogContentActions
