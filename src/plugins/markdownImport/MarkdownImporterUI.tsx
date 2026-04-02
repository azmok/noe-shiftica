'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useForm, useDocumentInfo } from '@payloadcms/ui'
import { DRAFT_SAVE_EVENT } from '../shared/draftStorage'

const KNOWN_FIELDS = ['title', 'slug', 'publishedAt', 'content', 'description']

export const MarkdownImporterUI: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)

    const form = useForm()
    const dispatchFields = form?.dispatchFields
    const { id } = useDocumentInfo()

    const contentToSlug = useCallback(async (title: string) => {
        try {
            const res = await fetch(`/api/translate-slug?title=${encodeURIComponent(title)}`)
            if (res.ok) {
                const { slug } = await res.json()
                return slug
            }
        } catch (e) {
            console.error('[MARKDOWN-IMPORTER] Slug translation failed', e)
        }
        return ''
    }, [])

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        console.group('[MARKDOWN-IMPORTER] Importing:', file.name)

        try {
            const text = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve(e.target?.result as string)
                reader.onerror = () => reject(new Error('FileReader failed'))
                reader.readAsText(file, 'UTF-8')
            })

            const response = await fetch('/api/convert-markdown', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: text,
            })

            if (!response.ok) throw new Error(`API error: ${response.statusText}`)

            const { frontmatter, lexical } = await response.json()

            if (dispatchFields) {
                dispatchFields({ type: 'UPDATE', path: 'title', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'slug', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'publishedAt', value: null })
                dispatchFields({ type: 'UPDATE', path: 'description', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: {} })
                dispatchFields({ type: 'UPDATE', path: 'content', value: null, initialValue: null })
            }

            await new Promise(resolve => setTimeout(resolve, 150))

            const customMetaData: Record<string, any> = {}
            Object.keys(frontmatter).forEach((key) => {
                if (!KNOWN_FIELDS.includes(key) && key !== 'date') {
                    customMetaData[key] = frontmatter[key]
                }
            })

            if (dispatchFields) {
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

                if (frontmatter.description) {
                    dispatchFields({ type: 'UPDATE', path: 'description', value: frontmatter.description })
                }

                dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: customMetaData })

                if (lexical) {
                    dispatchFields({ type: 'UPDATE', path: 'content', value: lexical, initialValue: lexical })
                }

                if (form?.setModified) {
                    form.setModified(true)
                }
            }

            console.log('[MARKDOWN-IMPORTER] Import complete.')
            // レンダリングが落ち着いてから autosave プラグインに保存を依頼
            if (!id) {
                setTimeout(() => window.dispatchEvent(new CustomEvent(DRAFT_SAVE_EVENT)), 500)
            }
        } catch (error) {
            console.error('[MARKDOWN-IMPORTER] Import failed:', error)
            alert('Failed to import Markdown.')
        } finally {
            setIsImporting(false)
            console.groupEnd()
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }, [dispatchFields, contentToSlug, form, id])

    return (
        <div style={{ padding: '0 0.5rem 1rem' }}>
            <input
                type="file"
                accept=".md"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); fileInputRef.current?.click() }}
                disabled={isImporting}
                className="btn btn--style-secondary btn--size-small"
                style={{ width: '100%' }}
            >
                {isImporting ? 'Importing...' : '📄 Markdown Importer'}
            </button>
        </div>
    )
}

export default MarkdownImporterUI
