'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useForm, useDocumentInfo } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { DRAFT_KEY, DRAFT_SAVE_EVENT, saveDraft, clearDraft, loadDraft } from '../shared/draftStorage'

export const AutosaveUI: React.FC = () => {
    const form = useForm()
    const dispatchFields = form?.dispatchFields
    const { id } = useDocumentInfo()
    const pathname = usePathname()

    const doSave = useCallback(() => {
        if (id || !form) return
        saveDraft(form.getData())
    }, [id, form])

    // ページ遷移時に復元フラグをリセット
    const hasRestored = useRef(false)
    useEffect(() => {
        hasRestored.current = false
    }, [pathname])

    // 新規作成時のみ: フォームが空になった瞬間にキャッシュを再注入
    useEffect(() => {
        if (id) return

        const draft = loadDraft()
        if (!draft || !dispatchFields) return

        console.log('[AUTOSAVE] Draft found, starting restoration watcher...')

        let attempts = 0
        const intervalId = setInterval(() => {
            attempts++
            const currentData = form?.getData() || {}
            const isFormEmpty = !currentData.title && !currentData.description

            if (isFormEmpty && (draft.title || draft.content)) {
                console.log(`[AUTOSAVE] Form reset detected. Injecting draft (Attempt ${attempts})...`)
                Object.entries(draft).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        dispatchFields({ type: 'UPDATE', path: key, value })
                    }
                })
                if (form?.setModified) form.setModified(true)
            }

            if (currentData.title === draft.title || attempts > 10) {
                console.log('[AUTOSAVE] Draft restoration complete.')
                clearInterval(intervalId)
            }
        }, 250)

        return () => clearInterval(intervalId)
    }, [id, dispatchFields, form, pathname])

    // id 付与時（保存/公開時）にキャッシュをクリア
    useEffect(() => {
        if (id) {
            const exists = localStorage.getItem(DRAFT_KEY)
            if (exists) {
                clearDraft()
                console.log('[AUTOSAVE] Local draft cleared (Post saved/published).')
            }
        }
    }, [id])

    // --- keyup: タイピング中の定期保存 ---
    useEffect(() => {
        if (id) return

        let timer: NodeJS.Timeout
        const handleKeyUp = () => {
            clearTimeout(timer)
            timer = setTimeout(doSave, 1000)
        }

        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keyup', handleKeyUp)
            clearTimeout(timer)
        }
    }, [id, doSave])

    // --- noe:draft-save: 他プラグインからの明示的な保存要求 ---
    useEffect(() => {
        if (id) return

        const handleSaveRequest = () => {
            console.log('[AUTOSAVE] Received noe:draft-save event. Saving...')
            doSave()
        }

        window.addEventListener(DRAFT_SAVE_EVENT, handleSaveRequest)
        return () => window.removeEventListener(DRAFT_SAVE_EVENT, handleSaveRequest)
    }, [id, doSave])

    // 表示なし — バックグラウンドで動作するだけ
    return null
}

export default AutosaveUI
