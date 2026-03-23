import type { CollectionConfig } from 'payload'

function extractFromHtml(html: string): { bodyHtml: string; embedCss: string } {
  // <link rel="stylesheet"> tags (Google Fonts etc.)
  const linkMatches = html.match(/<link[^>]+rel=["']?stylesheet["']?[^>]*\/?>/gi) ?? []

  // <style> tags (full tags, not just content)
  const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []

  // Store both link and style tags together
  const embedCss = [...linkMatches, ...styleMatches].join('\n')

  // Transform <body> tag into <div id="uploaded-content"> while preserving attributes
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i)
  let bodyHtml = html
  if (bodyMatch) {
    const attrs = bodyMatch[1]
    const content = bodyMatch[2]
    
    // Check if original body had an ID to avoid double IDs, though we prioritize 'uploaded-content'
    let finalAttrs = attrs
    if (attrs.includes('id=')) {
      // Replace existing ID with uploaded-content
      finalAttrs = attrs.replace(/id=["'][^"']*["']/, 'id="uploaded-content"')
    } else {
      finalAttrs = ` id="uploaded-content"${attrs}`
    }
    
    bodyHtml = `<div${finalAttrs}>${content}</div>`
  }

  return { bodyHtml, embedCss }
}

export const HtmlFiles: CollectionConfig = {
  slug: 'html-files',
  labels: {
    singular: '埋め込みHTMLファイル',
    plural: '埋め込みHTMLファイル',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const file = (req as any).file
        if (file?.data && file.mimetype === 'text/html') {
          const html = Buffer.isBuffer(file.data)
            ? file.data.toString('utf-8')
            : String(file.data)
          const { bodyHtml } = extractFromHtml(html)
          let { embedCss } = extractFromHtml(html)

          // Transform 'body { ... }' into '#uploaded-content { ... }' for strict scoping
          if (embedCss) {
            embedCss = embedCss.replace(
              /(^|}|;|,|\s)body(?=\s*[,{\.#:])/gi,
              '$1#uploaded-content'
            )
          }

          data.bodyHtml = bodyHtml
          data.embedCss = embedCss
        }
        return data
      },
    ],
    afterRead: [
      ({ doc }) => {
        const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET || 'noe-shiftica.firebasestorage.app'
        if (doc.filename) {
          doc.url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(doc.filename)}?alt=media`
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'ファイル説明',
      required: false,
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
      admin: {
        readOnly: true,
        description: 'HTMLファイルから自動抽出された body コンテンツ',
      },
    },
    {
      name: 'embedCss',
      type: 'textarea',
      admin: {
        readOnly: true,
        description: 'HTMLファイルから自動抽出された CSS スタイル',
      },
    },
  ],
  upload: {
    mimeTypes: ['text/html'],
    allowRestrictedFileTypes: true,
  },
}
