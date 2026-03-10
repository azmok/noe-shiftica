'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useForm, useField } from '@payloadcms/ui'

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

            const customMetaData: Record<string, any> = {}
            Object.keys(frontmatter).forEach((key) => {
                if (!KNOWN_FIELDS.includes(key) && key !== 'date') {
                    customMetaData[key] = frontmatter[key]
                }
            })

            if (dispatchFields) {
                // Clear and Update
                dispatchFields({ type: 'UPDATE', path: 'title', value: frontmatter.title || '' })
                if (frontmatter.title) {
                    const slug = await contentToSlug(frontmatter.title)
                    dispatchFields({ type: 'UPDATE', path: 'slug', value: slug })
                }

                const dateStr = frontmatter.date || frontmatter.publishedAt
                if (dateStr) {
                    const parsedDate = new Date(dateStr)
                    if (!isNaN(parsedDate.getTime())) {
                        dispatchFields({ type: 'UPDATE', path: 'publishedAt', value: parsedDate.toISOString() })
                    }
                }

                dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: customMetaData })

                if (lexical) {
                    dispatchFields({
                        type: 'UPDATE',
                        path: 'content',
                        value: lexical,
                        initialValue: lexical,
                    })
                }
            }
            console.log('[BLOG-ACTIONS] Markdown import complete.')
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

        if (!title) {
            alert('Please enter a title first.')
            return
        }

        setIsOptimizing(true)
        console.group('[BLOG-ACTIONS] AI Optimizing...')

        try {
            const response = await fetch('/api/posts/ai-enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            })

            if (!response.ok) throw new Error('AI Enrichment failed')

            const { description, customMetaData } = await response.json()

            if (dispatchFields) {
                if (description) {
                    dispatchFields({ type: 'UPDATE', path: 'description', value: description })
                }
                if (customMetaData) {
                    dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: customMetaData })
                }
            }
            console.log('[BLOG-ACTIONS] AI optimization complete.')
        } catch (error) {
            console.error('[BLOG-ACTIONS] AI Optimization failed:', error)
            alert('AI Optimization failed.')
        } finally {
            setIsOptimizing(false)
            console.groupEnd()
        }
    }, [fieldTitle?.value, fieldContent?.value, dispatchFields])

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
        </div>
    )
}

export default BlogContentActions
