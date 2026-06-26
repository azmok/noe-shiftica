'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
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

/**
 * Coerce an ID back to the type Payload's relationship validation expects.
 * Postgres uses numeric (serial) IDs and `isValidID(value, 'number')` only
 * accepts `typeof value === 'number'`. `toId` stringifies everything for
 * internal comparison, so we must convert numeric-looking IDs back to numbers
 * before writing them into the `categories` form state — otherwise saving
 * fails with "The following field is invalid: Categories". Non-numeric IDs
 * (text / ObjectID collections) are passed through unchanged.
 */
function toRelValue(id: string): string | number {
  return /^\d+$/.test(id) ? Number(id) : id
}

/** Canonical key for a list of category names (case/order-insensitive). */
function canonNames(names: string[]): string {
  return JSON.stringify(
    [...names].map((s) => s.trim().toLowerCase()).filter(Boolean).sort(),
  )
}

export const TagField: React.FC = () => {
  const { value, setValue } = useField<unknown[]>({ path: 'categories' })
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

  // UX: カテゴリ登録中フラグ（ref で管理 → stale closure による Enter 無効化バグを防ぐ）
  const [isCommitting, setIsCommitting] = useState(false)
  const isCommittingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ドロップダウン内のホバー/アクティブ管理
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null)
  // 編集モード: suggestion リスト内でインライン rename
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  // 削除確認ダイアログ
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)

  // ---- 双方向同期用の内部状態 ----
  const lastIdsRef = useRef<string>('__UNINIT__')
  const lastNamesRef = useRef<string>('__UNINIT__')
  const resolvingRef = useRef(false)
  const refetchingRef = useRef(false)

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

  // 未知IDを検知したら一覧を取り直して名前解決する
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
      .finally(() => { refetchingRef.current = false })
  }, [value, categoriesLoaded, catById])

  // カテゴリ名の配列を ID 配列へ解決する（無ければ新規作成）
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
      return Array.from(new Set(ids))
    },
    [allCategories],
  )

  // ===== カテゴリの双方向同期 =====
  const metaCategoriesKey = useMemo(() => {
    const cats = (metaValue as Record<string, unknown> | null)?.categories
    if (!Array.isArray(cats)) return '[]'
    return JSON.stringify(cats.map((x) => String(x).trim()).filter(Boolean))
  }, [metaValue])

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
    const namesKey = metaCategoriesKey

    if (lastIdsRef.current === '__UNINIT__') {
      lastIdsRef.current = idsKey
      lastNamesRef.current = namesKey
      return
    }

    const idsChanged = idsKey !== lastIdsRef.current
    const namesChanged = namesKey !== lastNamesRef.current
    if (!idsChanged && !namesChanged) return

    const idsAsNames = currentIds
      .map((id) => catById.get(String(id))?.name)
      .filter(Boolean) as string[]
    if (canonNames(idsAsNames) === canonNames(metaNames)) {
      lastIdsRef.current = idsKey
      lastNamesRef.current = namesKey
      return
    }

    if (idsChanged) {
      if (currentIds.some((id) => !catById.has(String(id)))) return
      setMetaValue({ ...metaObj, categories: idsAsNames })
      lastIdsRef.current = idsKey
      lastNamesRef.current = JSON.stringify(idsAsNames)
    } else if (namesChanged) {
      resolvingRef.current = true
      ;(async () => {
        try {
          const ids = await resolveNamesToIds(metaNames)
          setValue(ids.map(toRelValue))
          lastIdsRef.current = JSON.stringify(ids)
          lastNamesRef.current = namesKey
        } finally {
          resolvingRef.current = false
        }
      })()
    }
  }, [value, metaCategoriesKey, categoriesLoaded, catById, resolveNamesToIds, setMetaValue, setValue, metaValue])

  // Update suggestions based on current input and focus state
  useEffect(() => {
    const trimmed = inputValue.trim()
    const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]

    const available = allCategories.filter(
      (c) => !currentIds.includes(String(c.id)),
    )

    if (!trimmed) {
      setSuggestions(available)
      setShowSuggestions(isFocused && available.length > 0)
      setActiveSuggestionIndex(-1)
      return
    }

    const filtered = available.filter((c) =>
      c.name.toLowerCase().includes(trimmed.toLowerCase()),
    )
    setSuggestions(filtered)
    setShowSuggestions(isFocused && filtered.length > 0)
    setActiveSuggestionIndex(-1)
  }, [inputValue, allCategories, value, isFocused])

  // ===== カテゴリ追加 =====
  const commitCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      if (isCommittingRef.current) return

      isCommittingRef.current = true
      setIsCommitting(true)
      setInputValue('')
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)

      try {
        const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]

        const existing = allCategories.find(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
        )

        let categoryId: string
        if (existing) {
          categoryId = String(existing.id)
        } else {
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
          categoryId = String(data.doc?.id ?? data.id)
          const newCat: Category = { id: categoryId, name: trimmed }
          setAllCategories((prev) => [...prev, newCat])
        }

        if (currentIds.includes(categoryId)) return

        const nextIds = [...currentIds, categoryId]
        lastIdsRef.current = JSON.stringify(nextIds)
        setValue(nextIds.map(toRelValue))
      } finally {
        isCommittingRef.current = false
        setIsCommitting(false)
      }
    },
    [allCategories, value, setValue],
  )

  // ===== カテゴリをこの記事から削除（紐付け解除のみ）=====
  const removeCategory = useCallback(
    (id: string) => {
      const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]
      const nextIds = currentIds.filter((existingId) => existingId !== String(id))
      lastIdsRef.current = JSON.stringify(nextIds)
      setValue(nextIds.map(toRelValue))
    },
    [value, setValue],
  )

  // ===== カテゴリをシステムから完全に削除 =====
  const deleteGlobalCategory = useCallback(async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        console.error('[TagField] failed to delete category', await res.text())
        return
      }
      // allCategories から除去
      setAllCategories((prev) => prev.filter((c) => String(c.id) !== String(id)))
      // この記事の選択からも除去
      const currentIds = (value ?? []).map(toId).filter(Boolean) as string[]
      const nextIds = currentIds.filter((existingId) => existingId !== String(id))
      lastIdsRef.current = JSON.stringify(nextIds)
      setValue(nextIds.map(toRelValue))
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }, [value, setValue])

  // ===== カテゴリ名をリネーム =====
  const renameCategory = useCallback(async (id: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setIsRenaming(true)
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) {
        console.error('[TagField] failed to rename category', await res.text())
        return
      }
      setAllCategories((prev) =>
        prev.map((c) => String(c.id) === String(id) ? { ...c, name: trimmed } : c)
      )
    } finally {
      setIsRenaming(false)
      setEditingCatId(null)
      setEditingCatName('')
    }
  }, [])

  // latestRef to avoid stale closures in the native event listener
  const latestRef = useRef({
    inputValue,
    suggestions,
    activeSuggestionIndex,
    commitCategory,
  })

  useEffect(() => {
    latestRef.current = {
      inputValue,
      suggestions,
      activeSuggestionIndex,
      commitCategory,
    }
  })

  // Capture Enter key at the native DOM level to prevent Payload's parent form submission
  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        const { inputValue, suggestions, activeSuggestionIndex, commitCategory } = latestRef.current
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          commitCategory(suggestions[activeSuggestionIndex].name)
        } else if (inputValue.trim()) {
          commitCategory(inputValue)
        }
      }
    }

    el.addEventListener('keydown', handler, true) // capture: true
    el.addEventListener('keypress', handler, true) // capture: true
    return () => {
      el.removeEventListener('keydown', handler, true)
      el.removeEventListener('keypress', handler, true)
    }
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // React synthetic keydown fallback (native capture handler will usually run first)
      e.preventDefault()
      e.stopPropagation()
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

  const deleteConfirmCat = deleteConfirmId ? catById.get(String(deleteConfirmId)) ?? allCategories.find(c => String(c.id) === String(deleteConfirmId)) : null

  return (
    <div className="field-type">
      <label className="field-label">カテゴリ</label>

      {/* 削除確認ダイアログ */}
      {deleteConfirmId && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--theme-bg)',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '360px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '15px' }}>
              カテゴリーを削除
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--theme-elevation-500)', lineHeight: 1.6 }}>
              「<strong>{deleteConfirmCat?.name}</strong>」をシステムから完全に削除します。<br />
              このカテゴリーを使用している全記事から削除されます。
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '6px 16px', borderRadius: '4px', border: '1px solid var(--theme-elevation-200)',
                  background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--theme-text)',
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => deleteGlobalCategory(deleteConfirmId)}
                disabled={isDeleting}
                style={{
                  padding: '6px 16px', borderRadius: '4px', border: 'none',
                  background: '#ef4444', color: '#fff', cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '13px', opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Selected tag chips */}
      {selectedCategories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
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
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0 2px', lineHeight: 1, color: 'var(--theme-text)',
                  opacity: 0.6, fontSize: '14px',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input: native event capture for Enter */}
      <div style={{ position: 'relative' }}>
        {/* 処理中プログレスバー */}
        {isCommitting && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'var(--theme-elevation-100)', borderRadius: '2px',
            overflow: 'hidden', zIndex: 10,
          }}>
            <div style={{
              height: '100%', background: 'var(--theme-success-500, #22c55e)',
              animation: 'tagfield-progress 1.2s ease-in-out infinite', width: '40%',
            }} />
          </div>
        )}
        <style>{`
          @keyframes tagfield-progress {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
          .tagfield-suggestion-item { position: relative; }
          .tagfield-suggestion-actions {
            display: none;
            position: absolute;
            right: 6px;
            top: 50%;
            transform: translateY(-50%);
            gap: 4px;
            align-items: center;
          }
          .tagfield-suggestion-item:hover .tagfield-suggestion-actions,
          .tagfield-suggestion-item.touched .tagfield-suggestion-actions {
            display: flex;
          }
          .tagfield-action-btn {
            padding: 2px 7px;
            border-radius: 3px;
            border: 1px solid transparent;
            font-size: 11px;
            cursor: pointer;
            line-height: 1.5;
            white-space: nowrap;
          }
          .tagfield-action-btn.edit {
            background: var(--theme-elevation-100);
            border-color: var(--theme-elevation-200);
            color: var(--theme-text);
          }
          .tagfield-action-btn.edit:hover { background: var(--theme-elevation-150); }
          .tagfield-action-btn.delete {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #b91c1c;
          }
          .tagfield-action-btn.delete:hover { background: #fecaca; }
          .tagfield-edit-input {
            flex: 1;
            padding: 2px 6px;
            border: 1px solid var(--theme-elevation-300);
            border-radius: 3px;
            font-size: 13px;
            background: var(--theme-bg);
            color: var(--theme-text);
            min-width: 0;
          }
        `}</style>

        <input
          ref={inputRef}
          type="text"
          className="field-type__input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => { setIsFocused(false); setShowSuggestions(false) }, 150)}
          placeholder={isCommitting ? '登録中...' : 'カテゴリを入力して Enter'}
          disabled={isCommitting}
          style={isCommitting ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        />

        {/* Suggestions dropdown */}
        {(showSuggestions || (isFocused && allCategories.length > 0 && !inputValue.trim())) && (
          <ul
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--theme-bg)', border: '1px solid var(--theme-elevation-200)',
              borderRadius: '4px', listStyle: 'none', margin: '2px 0 0', padding: '4px 0',
              zIndex: 99999, maxHeight: '220px', overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {suggestions.map((s, i) => (
              <li
                key={s.id}
                className={`tagfield-suggestion-item${hoveredSuggestionId === s.id ? ' touched' : ''}`}
                onMouseEnter={() => setHoveredSuggestionId(s.id)}
                onMouseLeave={() => { setHoveredSuggestionId(null); if (editingCatId !== s.id) {} }}
                onTouchStart={() => setHoveredSuggestionId(s.id)}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: i === activeSuggestionIndex ? 'var(--theme-elevation-100)' : 'transparent',
                  minHeight: '34px',
                }}
              >
                {editingCatId === s.id ? (
                  /* インライン rename 編集フォーム */
                  <>
                    <input
                      className="tagfield-edit-input"
                      value={editingCatName}
                      autoFocus
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        e.nativeEvent.stopImmediatePropagation()
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          renameCategory(s.id, editingCatName)
                        }
                        if (e.key === 'Escape') {
                          setEditingCatId(null)
                          setEditingCatName('')
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      className="tagfield-action-btn edit"
                      disabled={isRenaming}
                      onMouseDown={(e) => { e.preventDefault(); renameCategory(s.id, editingCatName) }}
                    >
                      {isRenaming ? '...' : '保存'}
                    </button>
                    <button
                      type="button"
                      className="tagfield-action-btn"
                      style={{ background: 'none', border: 'none', color: 'var(--theme-elevation-400)', fontSize: '12px' }}
                      onMouseDown={(e) => { e.preventDefault(); setEditingCatId(null); setEditingCatName('') }}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  /* 通常表示 */
                  <>
                    <span
                      style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onMouseDown={() => commitCategory(s.name)}
                    >
                      {s.name}
                    </span>
                    <span className="tagfield-suggestion-actions">
                      <button
                        type="button"
                        className="tagfield-action-btn edit"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditingCatId(s.id)
                          setEditingCatName(s.name)
                        }}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        className="tagfield-action-btn delete"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDeleteConfirmId(s.id)
                        }}
                      >
                        削除
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}

            {/* 新規作成オプション */}
            {inputValue.trim() && !allCategories.some(
              (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase()
            ) && (
              <li
                onMouseDown={() => commitCategory(inputValue)}
                style={{
                  padding: '6px 12px', cursor: 'pointer', fontSize: '13px',
                  borderTop: suggestions.length > 0 ? '1px solid var(--theme-elevation-200)' : 'none',
                  color: 'var(--theme-success-500, #22c55e)', fontWeight: 500,
                }}
              >
                + 「{inputValue.trim()}」を新規作成
              </li>
            )}
          </ul>
        )}

        {/* 既存候補ゼロ + 入力あり → 新規作成ヒント */}
        {isFocused && !showSuggestions && inputValue.trim() && (
          <ul style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'var(--theme-bg)', border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px', listStyle: 'none', margin: '2px 0 0', padding: '4px 0',
            zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            <li
              onMouseDown={() => commitCategory(inputValue)}
              style={{
                padding: '6px 12px', cursor: 'pointer', fontSize: '13px',
                color: 'var(--theme-success-500, #22c55e)', fontWeight: 500,
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
