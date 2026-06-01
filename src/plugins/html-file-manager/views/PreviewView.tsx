import React from 'react'
import type { AdminViewProps } from 'payload'
import { PreviewViewClient } from './PreviewViewClient'

// Payload admin custom view — rendered at /admin/html-files-preview?id=:id
// Replaces the old frontend route src/app/(frontend)/html-files/[id]/preview/
export const PreviewView: React.FC<AdminViewProps> = async ({
  initPageResult,
  searchParams,
}) => {
  const id = searchParams?.id as string | undefined

  let initialData: any = { id: id ?? '', bodyHtml: '', embedCss: '' }

  if (id) {
    try {
      const doc = await initPageResult.req.payload.findByID({
        collection: 'html-files',
        id,
        depth: 0,
        draft: true,
        overrideAccess: true,
      })
      initialData = doc
    } catch {
      // not found — fall through to empty placeholder
    }
  }

  return <PreviewViewClient initialData={initialData} />
}
