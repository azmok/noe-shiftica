'use client'

import React, { useRef, useState } from 'react'
import { useForm } from '@payloadcms/ui'

export const ImportButton: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)
    const { dispatchFields } = useForm()

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

            // Populate Content (RichText Lexical)
            if (lexical) {
                dispatchFields({
                    type: 'UPDATE',
                    path: 'content',
                    value: lexical,
                })
            }

            // Optionally, handle categories or other fields if present in frontmatter

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
    }

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
