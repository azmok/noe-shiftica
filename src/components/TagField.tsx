'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

/** Canonical key for a list of category names (case/order-insensitive). */
function canonNames(names: string[]): string {
  return JSON.stringify(
    [...names].map((s) => s.trim().toLowerCase()).filter(Boolean).sort(),
  )
}

export const TagField: React.FC = () => {
  const { value, setValue } = useField<unknown[]>({ path: 'categories' })
  // customMetaData の `categories`（カテゴリ名の文字列配列）と双方向同期する。
  // JSON エディタ(JsonCodeField)・タグ(TagsField)と同じフォーム状態を共有する。
  const { value: metaValue, setValue: setMetaValue } =
    useField<Record<string, unknown> | null>({ path: 'customMetaData' })

  const [inputValue, setInputValue] = useState('')
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [suggestions, setSuggestions] = useState<Category[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ---- 双方向同期用の内部状態 ----
  // 直近で「同期済み」とみなした categories(IDs) / customMetaData.categories(names) のキー。
  // どちら側が変化したかを判定し、片方向にだけ反映してループを防ぐ。
  const lastIdsRef = useRef<string>('')
  const lastNamesRef = useRef<string>('')
  const didInitRef = useRef(false)
  const resolvingRef = useRef(false) // JSON→ID 解決中（カテゴリ作成のため非同期）
  const refetchingRef = useRef(false) // 未知IDの名前解決のための再取得中

  const catById = useMemo(() => {
    const m = new Map<string, Category>()
    allCategories.forEach((c) => m.set(String(c.id), c))
    return m
  }, [allCategories])

  // Fetch all categories for autocomplete on mount
  useEffect(() => {
    fetch('/api/categories?limit=200&sort=name')
      .then((res) => res.json())
      .then((data) => setAllCategories((data.docs ?? []) as Category[]))
      .catch(console.error)
      .finally(() => setCategoriesLoaded(true))
  }, [])

  // Derive selectedCategories from form value + allCategories
  useEffect(() => {
    const ids = (value ?? []).map(toId).filter(Boolean) as string[]
    if (ids.length === 0) {
      setSelectedCategories([])
      return
    }
    const resolved = ids.map((id) => {
      const found = catById.get(String(id))
      return found ?? { id, name: id }
    })
    setSelectedCategories(resolved)
  }, [value, catById])

  // AI 最適化などで「allCategories にまだ無いカテゴリID」が categories に入ると、
  // チップが ID のまま表示される。未知IDを検知したら一覧を取り直して名前解決する。
  useEffect(() => {
    if (!categoriesLoaded || refetchingRef.current) return
    const ids = (value ?? []).map(toId).filter(Boolean) as string[]
    const hasUnknown = ids.some((id) => !catById.has(String(id)))
    if (!hasUnknown) return
    refetchingRef.current = true
    fetch('/api/categories?limit=200&sort=name')
      .then((res) => res.json())
      .then((data) => setAllCategories((data.docs ?? []) as Category[]))
      .catch(console.error)
      .finally(() => {
        refetchingRef.current = false
      })
  }, [value, categoriesLoaded, catById])

  // カテゴリ名の配列を ID 配列へ解決する（無ければ新規作成）。
  // 作成したカテゴリは allCategories にも反映し、チップ表示で名前が出るようにする。
  const resolveNamesToIds = useCallback(
    async (names: string[]): Promise<string[]> => {
      const ids: string[] = []
      const created: Category[] = []
      for (const raw of names) {
        const trimmed = raw.trim()
        if (!trimmed) continue
        const existing = allCategories.find(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
        )
        if (existing) {
          ids.push(String(existing.id))
          continue
        }
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        })
        if (!res.ok) {
          console.error('[TagField] failed to create category', await res.text())
          continue
        }
        const data = await res.json()
        const id = String(data.doc?.id ?? data.id)
        ids.push(id)
        created.push({ id, name: trimmed })
      }
      if (created.length > 0) {
        setAllCategories((prev) => [...prev, ...created])
      }
      // 重複IDを除去
      return Array.from(new Set(ids))
    },
    [allCategories],
  )

  // ===== カテゴリの双方向同期 =====
  // ・GUI(または AI)で categories(IDs) が変わったら customMetaData.categories(names) へ反映
  // ・customMetaData.categories(names) を JSON で編集したら categories(IDs) へ解決して反映
  useEffect(() => {
    if (!categoriesLoaded || resolvingRef.current) return

    const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]
    const idsKey = JSON.stringify(currentIds)

    const metaObj =
      metaValue && typeof metaValue === 'object'
        ? (metaValue as Record<string, unknown>)
        : {}
    const metaNames = Array.isArray(metaObj.categories)
      ? (metaObj.categories as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : []
    const namesKey = JSON.stringify(metaNames)

    // 初回（マウント時）は現状を記録するだけ。勝手に書き込んでフォームを
    // dirty にしたり、意図せずカテゴリを新規作成したりしない。
    if (!didInitRef.current) {
      didInitRef.current = true
      lastIdsRef.current = idsKey
      lastNamesRef.current = namesKey
      return
    }

    const idsChanged = idsKey !== lastIdsRef.current
    const namesChanged = namesKey !== lastNamesRef.current
    if (!idsChanged && !namesChanged) return

    // 既に同値（大文字小文字・順序を無視）なら何もしない（収束済み）
    const idsAsNames = currentIds
      .map((id) => catById.get(String(id))?.name)
      .filter(Boolean) as string[]
    if (canonNames(idsAsNames) === canonNames(metaNames)) {
      lastIdsRef.current = idsKey
      lastNamesRef.current = namesKey
      return
    }

    if (idsChanged) {
      // GUI / AI 側が変わった → 名前を JSON へミラー（IDの真実源を優先）
      // 未知IDが残っている間は名前解決を待つ（再取得後に再実行される）
      if (currentIds.some((id) => !catById.has(String(id)))) return
      setMetaValue({ ...metaObj, categories: idsAsNames })
      lastIdsRef.current = idsKey
      lastNamesRef.current = JSON.stringify(idsAsNames)
    } else if (namesChanged) {
      // JSON 側が編集された → 名前を ID へ解決して categories に反映
      resolvingRef.current = true
      ;(async () => {
        try {
          const ids = await resolveNamesToIds(metaNames)
          setValue(ids)
          lastIdsRef.current = JSON.stringify(ids)
          lastNamesRef.current = namesKey
        } finally {
          resolvingRef.current = false
        }
      })()
    }
  }, [value, metaValue, categoriesLoaded, catById, resolveNamesToIds, setMetaValue, setValue])

  // Update suggestions based on current input and focus state
  useEffect(() => {
    const trimmed = inputValue.trim()
    const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]

    // Filter out already-selected categories
    const available = allCategories.filter(
      (c) => !currentIds.includes(String(c.id)),
    )

    if (!trimmed) {
      // When focused but no input: show all available categories
      setSuggestions(available)
      setShowSuggestions(isFocused && available.length > 0)
      setActiveSuggestionIndex(-1)
      return
    }

    // Filter by input text
    const filtered = available.filter((c) =>
      c.name.toLowerCase().includes(trimmed.toLowerCase()),
    )
    setSuggestions(filtered)
    setShowSuggestions(isFocused && filtered.length > 0)
    setActiveSuggestionIndex(-1)
  }, [inputValue, allCategories, value, isFocused])

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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => { setIsFocused(false); setShowSuggestions(false) }, 150)}
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
            {/* Show "create new" option when input doesn't exactly match any existing category */}
            {inputValue.trim() && !allCategories.some(
              (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase()
            ) && (
              <li
                onMouseDown={() => commitCategory(inputValue)}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  borderTop: suggestions.length > 0 ? '1px solid var(--theme-elevation-200)' : 'none',
                  color: 'var(--theme-success-500, #22c55e)',
                  fontWeight: 500,
                }}
              >
                + 「{inputValue.trim()}」を新規作成
              </li>
            )}
          </ul>
        )}

        {/* Show hint when no suggestions and input is non-empty */}
        {isFocused && !showSuggestions && inputValue.trim() && (
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <li
              onMouseDown={() => commitCategory(inputValue)}
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--theme-success-500, #22c55e)',
                fontWeight: 500,
              }}
            >
              + 「{inputValue.trim()}」を新規作成
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}

