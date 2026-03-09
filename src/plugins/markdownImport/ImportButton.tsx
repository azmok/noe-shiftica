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
        if (!file) {
            console.log('[DEBUG-IMPORT] No file selected.');
            return
        }

        console.group('[DEBUG-IMPORT] === START IMPORT ===');
        console.log(`[DEBUG-IMPORT] File name: ${file.name}`);
        console.log(`[DEBUG-IMPORT] File size: ${file.size} bytes`);
        setIsImporting(true)

        try {
            // Use FileReader with explicit UTF-8 to avoid clipping/encoding issues
            const readFile = () => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = (e) => reject(new Error('FileReader failed'));
                reader.readAsText(file, 'UTF-8');
            });

            let text = '';
            try {
                text = await readFile();
                console.log(`[DEBUG-IMPORT] FileReader success. Length: ${text.length}`);
            } catch (e) {
                console.warn('[DEBUG-IMPORT] FileReader failed, falling back to file.text()');
                text = await file.text();
                console.log(`[DEBUG-IMPORT] file.text() fallback. Length: ${text.length}`);
            }

            const response = await fetch('/api/convert-markdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: text,
            })

            if (!response.ok) {
                console.error(`[DEBUG-IMPORT] API error: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to convert markdown: ${response.statusText}`)
            }

            const { frontmatter, lexical } = await response.json()
            console.log('[DEBUG-IMPORT] API Response received:', {
                hasFrontmatter: !!frontmatter,
                hasLexical: !!lexical,
                frontmatterData: frontmatter,
                lexicalRootType: lexical?.root?.type
            });

            // 1. CLEAR EXISTING CONTENT (Requirement: clear EVERYTHING first)
            console.log('[DEBUG-IMPORT] Step 1: Clearing all existing fields...');
            if (dispatchFields) {
                dispatchFields({ type: 'UPDATE', path: 'title', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'slug', value: '' })
                dispatchFields({ type: 'UPDATE', path: 'publishedAt', value: null })
                dispatchFields({ type: 'UPDATE', path: 'content', value: null, initialValue: null })
            }

            // Log the current field states immediately after calling clear
            console.log('[DEBUG-IMPORT] Clear commands sent. Current state should be empty.');

            // Small delay to ensure state clears before setting new ones (critical for UI stability)
            console.log('[DEBUG-IMPORT] Waiting 150ms for clear-out to propagate...');
            await new Promise(resolve => setTimeout(resolve, 150));

            // 2. SET NEW CONTENT
            console.log('[DEBUG-IMPORT] Step 2: Setting new content from Markdown...');

            // Populate Title
            if (frontmatter.title && dispatchFields) {
                console.log(`[DEBUG-IMPORT] Setting TITLE: "${frontmatter.title}"`);
                dispatchFields({ type: 'UPDATE', path: 'title', value: frontmatter.title })
            } else {
                console.warn('[DEBUG-IMPORT] Skipping Title (missing in frontmatter or dispatchFields missing)');
            }

            // Populate PublishedAt (from 'date' or 'publishedAt' in frontmatter)
            const dateStr = frontmatter.date || frontmatter.publishedAt
            if (dateStr && dispatchFields) {
                const parsedDate = new Date(dateStr)
                if (!isNaN(parsedDate.getTime())) {
                    const isoDate = parsedDate.toISOString();
                    console.log(`[DEBUG-IMPORT] Setting PUBLISHED_AT: ${isoDate}`);
                    dispatchFields({ type: 'UPDATE', path: 'publishedAt', value: isoDate })
                } else {
                    console.error(`[DEBUG-IMPORT] Invalid date format: ${dateStr}`);
                }
            }

            // Auto-generate slug from title (handles Japanese → English translation)
            if (frontmatter.title) {
                try {
                    console.log('[DEBUG-IMPORT] Requesting SLUG translation...');
                    const slugRes = await fetch(
                        `/api/translate-slug?title=${encodeURIComponent(frontmatter.title)}`
                    )
                    if (slugRes.ok) {
                        const { slug } = await slugRes.json()
                        if (slug && dispatchFields) {
                            console.log(`[DEBUG-IMPORT] Setting SLUG: "${slug}"`);
                            dispatchFields({ type: 'UPDATE', path: 'slug', value: slug })
                        } else {
                            console.warn('[DEBUG-IMPORT] Slug API returned empty slug');
                        }
                    } else {
                        console.error('[DEBUG-IMPORT] Slug translation API failed');
                    }
                } catch (e) {
                    console.error('[DEBUG-IMPORT] Exception during slug generation:', e);
                }
            }

            // Populate Content (RichText Lexical)
            if (lexical && dispatchFields) {
                console.log('[DEBUG-IMPORT] Setting LEXICAL content state. root nodes:', lexical.root?.children?.length);
                // Ensure lexical is an object
                const contentToSet = typeof lexical === 'string' ? JSON.parse(lexical) : lexical;
                dispatchFields({
                    type: 'UPDATE',
                    path: 'content',
                    value: contentToSet,
                    initialValue: contentToSet // Forcing initialValue triggers Lexical to re-initialize
                })
                console.log('[DEBUG-IMPORT] dispatchFields UPDATE for content completed.');
            } else {
                console.warn('[DEBUG-IMPORT] Skipping Content (missing in response or dispatchFields missing)');
            }

            // Clear the input so the same file could be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            console.log('[DEBUG-IMPORT] === IMPORT SUCCESSFUL ===');
            console.groupEnd();
        } catch (error) {
            console.error('[DEBUG-IMPORT] !!! IMPORT FAILED !!!', error)
            console.groupEnd();
            alert('Error importing markdown file. Check console for details.')
        } finally {
            setIsImporting(false)
        }
    }, [setTitle, setPublishedAt, setSlug, setContent])

    // Debugging Effect: Monitor field values in real-time
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log('[DEBUG-IMPORT-UI] Field Values Changed:', {
                title: fieldTitle?.value,
                slug: fieldSlug?.value,
                publishedAt: fieldPublishedAt?.value,
                hasContent: !!fieldContent?.value,
            });
        }
    }, [fieldTitle?.value, fieldSlug?.value, fieldPublishedAt?.value, fieldContent?.value]);

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
