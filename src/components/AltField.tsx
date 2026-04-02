'use client'

import React, { useEffect, useRef } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

/**
 * AltField
 *
 * Custom field component for the `alt` text field in the Media collection.
 *
 * Behavior:
 * - When a file is selected (filename populates), auto-fill alt with the
 *   filename (without extension) if alt is currently empty.
 * - If the user manually edits alt, their input is preserved.
 * - When a new file is selected (filename changes), re-apply auto-fill
 *   only if alt still matches the previous auto-filled value or is empty.
 */
export const AltField: React.FC = () => {
  const { value: alt, setValue: setAlt } = useField<string>({ path: 'alt' })
  const filename = useFormFields(([fields]) => fields['filename']?.value as string | undefined)

  const autoFilledValue = useRef<string | undefined>(undefined)
  const prevFilename = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!filename) return

    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')

    const filenameChanged = filename !== prevFilename.current

    if (filenameChanged) {
      // New file selected: auto-fill if alt is empty or matches the previous auto-fill
      if (!alt || alt === autoFilledValue.current) {
        setAlt(nameWithoutExt)
        autoFilledValue.current = nameWithoutExt
      }
      prevFilename.current = filename
    } else if (!alt && !autoFilledValue.current) {
      // Initial mount with existing filename (edit mode)
      setAlt(nameWithoutExt)
      autoFilledValue.current = nameWithoutExt
      prevFilename.current = filename
    }
  }, [filename, alt, setAlt])

  return (
    <div className="field-type text">
      <label className="field-label" htmlFor="field-alt">
        Alt Text
        <span className="required">*</span>
      </label>
      <input
        id="field-alt"
        type="text"
        className="field-type__input"
        value={alt ?? ''}
        onChange={(e) => {
          autoFilledValue.current = undefined
          setAlt(e.target.value)
        }}
        placeholder={filename ? filename.replace(/\.[^/.]+$/, '') : 'alt テキストを入力'}
      />
    </div>
  )
}
