export const DRAFT_KEY = 'payload-draft-post-new'

/** 各プラグインが「今すぐ保存して」と伝えるカスタムイベント名 */
export const DRAFT_SAVE_EVENT = 'noe:draft-save'

export function saveDraft(data: Record<string, any>): void {
    const draft = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        publishedAt: data.publishedAt,
        customMetaData: data.customMetaData,
        content: data.content,
    }
    if (draft.title || draft.content || draft.description) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    }
}

export function clearDraft(): void {
    localStorage.removeItem(DRAFT_KEY)
}

export function loadDraft(): Record<string, any> | null {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) return null
    try {
        return JSON.parse(saved)
    } catch {
        return null
    }
}
