'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useForm, useField } from '@payloadcms/ui'

export const ImportButton: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)

    // Use useForm with safety
    const form = useForm()
    const dispatchFields = form?.dispatchFields

    // Use useField hooks for individual fields to ensure immediate UI updates
    const fieldContent = useField<any>({ path: 'content' })
    const fieldTitle = useField<string>({ path: 'title' })
    const fieldSlug = useField<string>({ path: 'slug' })
    const fieldPublishedAt = useField<string>({ path: 'publishedAt' })

    const setContent = fieldContent?.setValue
    const setTitle = fieldTitle?.setValue
    const setSlug = fieldSlug?.setValue
    const setPublishedAt = fieldPublishedAt?.setValue

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        console.log(`[DEBUG] Import started for file: ${file.name}`);
        setIsImporting(true)

        try {
            const text = await file.text()
            console.log(`[DEBUG] File read successfully. Length: ${text.length}`);

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
            console.log('[DEBUG] API Response received:', {
                hasFrontmatter: !!frontmatter,
                hasLexical: !!lexical,
                title: frontmatter?.title
            });

            // 1. CLEAR EXISTING CONTENT (Requirement: cleared once before importing)
            console.log('[DEBUG] Clearing existing content...');
            if (setTitle) setTitle('')
            if (setSlug) setSlug('')
            if (setPublishedAt) setPublishedAt(null as any)
            if (setContent) setContent(null)

            // Small delay to ensure state clears before setting new ones
            await new Promise(resolve => setTimeout(resolve, 100));

            // 2. SET NEW CONTENT
            console.log('[DEBUG] Setting new content...');

            // Populate Title
            if (frontmatter.title && setTitle) {
                console.log(`[DEBUG] Setting Title: ${frontmatter.title}`);
                setTitle(frontmatter.title)
            }

            // Populate PublishedAt (from 'date' or 'publishedAt' in frontmatter)
            const dateStr = frontmatter.date || frontmatter.publishedAt
            if (dateStr && setPublishedAt) {
                const parsedDate = new Date(dateStr)
                if (!isNaN(parsedDate.getTime())) {
                    console.log(`[DEBUG] Setting PublishedAt: ${parsedDate.toISOString()}`);
                    setPublishedAt(parsedDate.toISOString())
                }
            }

            // Auto-generate slug from title (handles Japanese → English translation)
            if (frontmatter.title) {
                try {
                    console.log('[DEBUG] Generating slug from title...');
                    const slugRes = await fetch(
                        `/api/translate-slug?title=${encodeURIComponent(frontmatter.title)}`
                    )
                    if (slugRes.ok) {
                        const { slug } = await slugRes.json()
                        if (slug && setSlug) {
                            console.log(`[DEBUG] Setting Slug: ${slug}`);
                            setSlug(slug)
                        }
                    }
                } catch {
                    console.warn('[ImportButton] Failed to auto-generate slug')
                }
            }

            // Populate Content (RichText Lexical)
            if (lexical && setContent) {
                console.log('[DEBUG] Setting Lexical Content. State structure:', JSON.stringify(lexical).substring(0, 100) + '...');
                setContent(lexical)
                console.log('[DEBUG] setContent called successfully');
            }

            // Clear the input so the same file could be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            console.log('[DEBUG] Import process finished successfully');
        } catch (error) {
            console.error('[DEBUG] Error importing markdown:', error)
            alert('Error importing markdown file.')
        } finally {
            setIsImporting(false)
        }
    }, [setTitle, setPublishedAt, setSlug, setContent])

    // Debugging Effect: Monitor field values
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log('[DEBUG] Monitoring Field Values:', {
                title: fieldTitle?.value,
                slug: fieldSlug?.value,
                hasContent: !!fieldContent?.value,
            });
        }
    }, [fieldTitle?.value, fieldSlug?.value, fieldContent?.value]);

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
