'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useField } from '@payloadcms/ui'

type Category = { id: string; name: string }

/** Normalize a form-state value item to a plain ID string */
function toId(item: unknown): string | null {
  if (typeof item === 'string') return item
  if (typeof item === 'number') return String(item)
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>
    if ('id' in obj) return String(obj.id)
    if ('value' in obj) {
      const v = obj.value
      if (typeof v === 'string' || typeof v === 'number') return String(v)
      if (v && typeof v === 'object' && 'id' in (v as Record<string, unknown>))
        return String((v as Record<string, unknown>).id)
    }
  }
  return null
}

export const TagField: React.FC = () => {
  const { value, setValue } = useField<unknown[]>({ path: 'categories' })

  const [inputValue, setInputValue] = useState('')
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [suggestions, setSuggestions] = useState<Category[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch all categories for autocomplete on mount
  useEffect(() => {
    fetch('/api/categories?limit=200&sort=name')
      .then((res) => res.json())
      .then((data) => setAllCategories((data.docs ?? []) as Category[]))
      .catch(console.error)
  }, [])

  // Derive selectedCategories from form value + allCategories
  useEffect(() => {
    const ids = (value ?? []).map(toId).filter(Boolean) as string[]
    if (ids.length === 0) {
      setSelectedCategories([])
      return
    }
    const resolved = ids.map((id) => {
      const found = allCategories.find((c) => c.id === id)
      return found ?? { id, name: id }
    })
    setSelectedCategories(resolved)
  }, [value, allCategories])

  // Update suggestions based on current input
  useEffect(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setSuggestions([])
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
      return
    }
    const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]
    const filtered = allCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmed.toLowerCase()) &&
        !currentIds.includes(c.id),
    )
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
    setActiveSuggestionIndex(-1)
  }, [inputValue, allCategories, value])

  const commitCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return

      const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]

      // Check if an existing category matches (case-insensitive)
      const existing = allCategories.find(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
      )

      let categoryId: string
      if (existing) {
        categoryId = existing.id
      } else {
        // Create a new category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        })
        if (!res.ok) {
          console.error('[TagField] failed to create category', await res.text())
          return
        }
        const data = await res.json()
        categoryId = data.doc?.id ?? data.id
        const newCat: Category = { id: categoryId, name: trimmed }
        setAllCategories((prev) => [...prev, newCat])
      }

      // Avoid adding duplicate to current selection
      if (currentIds.includes(categoryId)) {
        setInputValue('')
        setShowSuggestions(false)
        return
      }

      setValue([...currentIds, categoryId])
      setInputValue('')
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
    },
    [allCategories, value, setValue],
  )

  const removeCategory = useCallback(
    (id: string) => {
      const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]
      setValue(currentIds.filter((v) => v !== id))
    },
    [value, setValue],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        commitCategory(suggestions[activeSuggestionIndex].name)
      } else {
        commitCategory(inputValue)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      )
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
      return
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
    }
  }

  return (
    <div className="field-type">
      <label className="field-label">カテゴリ</label>

      {/* Selected tag chips */}
      {selectedCategories.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '8px',
          }}
        >
          {selectedCategories.map((cat) => (
            <span
              key={cat.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--theme-elevation-100)',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              {cat.name}
              <button
                type="button"
                aria-label={`${cat.name} を削除`}
                onClick={() => removeCategory(cat.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 2px',
                  lineHeight: 1,
                  color: 'var(--theme-text)',
                  opacity: 0.6,
                  fontSize: '14px',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Text input + autocomplete dropdown */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="field-type__input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="カテゴリを入力して Enter"
        />

        {showSuggestions && (
          <ul
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--theme-bg)',
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: '4px',
              listStyle: 'none',
              margin: '2px 0 0',
              padding: '4px 0',
              zIndex: 100,
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {suggestions.map((s, i) => (
              <li
                key={s.id}
                onMouseDown={() => commitCategory(s.name)}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background:
                    i === activeSuggestionIndex
                      ? 'var(--theme-elevation-100)'
                      : 'transparent',
                }}
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
