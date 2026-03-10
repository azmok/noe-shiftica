'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useForm, useField } from '@payloadcms/ui'

const KNOWN_FIELDS = ['title', 'slug', 'publishedAt', 'content']

export const MdImporter: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)

    // Form mechanics
    const form = useForm()
    const dispatchFields = form?.dispatchFields

    // Field handles for known fields
    const fieldContent = useField<any>({ path: 'content' })
    const contentToSlug = useCallback(async (title: string) => {
        try {
            const res = await fetch(`/api/translate-slug?title=${encodeURIComponent(title)}`)
            if (res.ok) {
                const { slug } = await res.json()
                return slug
            }
        } catch (e) {
            console.error('[MD-IMPORTER] Slug translation failed', e)
        }
        return ''
    }, [])

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        console.group('[MD-IMPORTER] Parsing file:', file.name)

        try {
            // Read file as UTF-8
            const text = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve(e.target?.result as string)
                reader.onerror = (e) => reject(new Error('FileReader failed'))
                reader.readAsText(file, 'UTF-8')
            })

            // Convert via API
            const response = await fetch('/api/convert-markdown', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: text,
            })

            if (!response.ok) throw new Error(`API error: ${response.statusText}`)

            const { frontmatter, lexical } = await response.json()

            // 1. Separate known vs unknown metadata
            const customMetaData: Record<string, any> = {}
            Object.keys(frontmatter).forEach((key) => {
                if (!KNOWN_FIELDS.includes(key) && key !== 'date') {
                    customMetaData[key] = frontmatter[key]
                }
            })

            // 2. Prepare updates
            if (dispatchFields) {
                // Clear state slightly to ensure fresh update
                dispatchFields({ type: 'UPDATE', path: 'title', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'slug', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'publishedAt', value: null })
                dispatchFields({ type: 'UPDATE', path: 'content', value: null, initialValue: null })
                dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: null })

                await new Promise((resolve) => setTimeout(resolve, 100))

                // Title
                if (frontmatter.title) {
                    dispatchFields({ type: 'UPDATE', path: 'title', value: frontmatter.title })

                    // Slug generation
                    const slug = await contentToSlug(frontmatter.title)
                    if (slug) {
                        dispatchFields({ type: 'UPDATE', path: 'slug', value: slug })
                    }
                }

                // Date
                const dateStr = frontmatter.date || frontmatter.publishedAt
                if (dateStr) {
                    const parsedDate = new Date(dateStr)
                    if (!isNaN(parsedDate.getTime())) {
                        dispatchFields({ type: 'UPDATE', path: 'publishedAt', value: parsedDate.toISOString() })
                    }
                }

                // Custom Metadata
                dispatchFields({ type: 'UPDATE', path: 'customMetaData', value: customMetaData })

                // Content (Lexical) - Forcing initialValue triggers re-render
                if (lexical) {
                    dispatchFields({
                        type: 'UPDATE',
                        path: 'content',
                        value: lexical,
                        initialValue: lexical,
                    })
                }
            }

            console.log('[MD-IMPORTER] Instant synchronization complete.')
            console.groupEnd()
        } catch (error) {
            console.error('[MD-IMPORTER] Import failed:', error)
            alert('Failed to parse Markdown. See console for details.')
            console.groupEnd()
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }, [dispatchFields, contentToSlug])

    const handleButtonClick = (e: React.MouseEvent) => {
        e.preventDefault()
        fileInputRef.current?.click()
    }

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
                onClick={handleButtonClick}
                disabled={isImporting}
                className="btn btn--style-secondary btn--size-small"
                style={{ width: '100%', cursor: isImporting ? 'not-allowed' : 'pointer' }}
            >
                {isImporting ? 'Parsing...' : '📄 Markdown Importer'}
            </button>
        </div>
    )
}

export default MdImporter
