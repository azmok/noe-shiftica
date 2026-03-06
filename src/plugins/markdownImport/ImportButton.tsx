'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useForm, useField } from '@payloadcms/ui'

export const ImportButton: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)
    const { dispatchFields } = useForm()

    // useField gives us proper setValue that syncs Lexical's internal state
    const { setValue: setContent } = useField<Record<string, unknown>>({ path: 'content' })
    const { setValue: setSlug } = useField<string>({ path: 'slug' })

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)

        try {
            const text = await file.text()

            const response = await fetch('/api/convert-markdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: text,
            })

            if (!response.ok) {
                throw new Error(`Failed to convert markdown: ${response.statusText}`)
            }

            const { frontmatter, lexical } = await response.json()

            // Populate Title
            if (frontmatter.title) {
                dispatchFields({
                    type: 'UPDATE',
                    path: 'title',
                    value: frontmatter.title,
                })
            }

            // Populate PublishedAt (from 'date' or 'publishedAt' in frontmatter)
            const dateStr = frontmatter.date || frontmatter.publishedAt
            if (dateStr) {
                const parsedDate = new Date(dateStr)
                if (!isNaN(parsedDate.getTime())) {
                    dispatchFields({
                        type: 'UPDATE',
                        path: 'publishedAt',
                        value: parsedDate.toISOString(),
                    })
                }
            }

            // Auto-generate slug from title (handles Japanese → English translation)
            if (frontmatter.title) {
                try {
                    const slugRes = await fetch(
                        `/api/translate-slug?title=${encodeURIComponent(frontmatter.title)}`
                    )
                    if (slugRes.ok) {
                        const { slug } = await slugRes.json()
                        if (slug) {
                            setSlug(slug)
                        }
                    }
                } catch {
                    // Non-critical — slug can be filled manually
                    console.warn('[ImportButton] Failed to auto-generate slug')
                }
            }

            // Populate Content (RichText Lexical)
            // Use setContent from useField to properly sync the Lexical editor's internal state
            if (lexical) {
                setContent(lexical)
            }

            // Clear the input so the same file could be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error('Error importing markdown:', error)
            alert('Error importing markdown file.')
        } finally {
            setIsImporting(false)
        }
    }, [dispatchFields, setContent, setSlug])

    const handleImportClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    return (
        <div style={{ marginBottom: '1rem' }}>
            <input
                type="file"
                accept=".md,.mdx"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <button
                onClick={handleImportClick}
                disabled={isImporting}
                type="button"
                className="btn btn--style-secondary btn--size-medium btn--icon-style-without-border"
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                {isImporting ? 'Importing...' : '📥 Import from .md'}
            </button>
        </div>
    )
}

export default ImportButton
