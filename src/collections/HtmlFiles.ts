import type { CollectionConfig } from 'payload'

function synchronizeTOC(bodyHtml: string): string {
  // 1. Collect all fragment links and their text
  const links: { [id: string]: string } = {}
  const linkRegex = /<a\s[^>]*?href=["']#(.*?)["'][^>]*>(.*?)<\/a>/gi
  let lMatch
  while ((lMatch = linkRegex.exec(bodyHtml)) !== null) {
    const id = lMatch[1]
    const text = lMatch[2].replace(/<[^>]*>/g, '').trim()
    if (id && text) {
      links[id] = text
    }
  }

  // 2. Identify headings and update IDs
  return bodyHtml.replace(/<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi, (fullTag, tag, attrs, content) => {
    const headingText = content.replace(/<[^>]*>/g, '').trim()
    if (!headingText) return fullTag

    const idMatch = attrs.match(/id=["'](.*?)["']/)
    const currentId = idMatch ? idMatch[1] : null

    if (currentId && links[currentId]) return fullTag

    for (const [id, linkText] of Object.entries(links)) {
      if (headingText === linkText || headingText.includes(linkText) || linkText.includes(headingText)) {
        if (currentId) {
          const newAttrs = attrs.replace(/id=["'](.*?)["']/, `id="${id}"`)
          return `<${tag}${newAttrs}>${content}</${tag}>`
        } else {
          return `<${tag} id="${id}"${attrs}>${content}</${tag}>`
        }
      }
    }
    return fullTag
  })
}

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

  // Synchronize TOC links and IDs
  bodyHtml = synchronizeTOC(bodyHtml)

  return { bodyHtml, embedCss }
}

export const HtmlFiles: CollectionConfig = {
  slug: 'html-files',
  labels: {
    singular: '埋め込みHTMLファイル',
    plural: '埋め込みHTMLファイル',
  },
  admin: {
    defaultColumns: ['filename', 'linkedPostTitle', 'updatedAt'],
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
      async ({ doc, req }) => {
        const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET || 'noe-shiftica.firebasestorage.app'
        if (doc.filename) {
          doc.url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(doc.filename)}?alt=media`
        }
        // Reverse-lookup: find the post that references this html-file.
        // Only runs for authenticated admin users to avoid overhead on public reads.
        if (req.user) {
          try {
            const result = await req.payload.find({
              collection: 'posts',
              where: { htmlEmbed: { equals: doc.id } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })
            doc.linkedPostTitle = result.docs[0]?.title ?? null
          } catch {
            // ignore
          }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'linkedPostTitle',
      type: 'text',
      virtual: true,
      label: '紐付き記事',
      admin: {
        readOnly: true,
        disableBulkEdit: true,
        components: {
          Cell: '@/components/LinkedPostCell#LinkedPostCell',
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
      label: 'ファイル説明',
      required: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
      admin: {
        description: 'HTMLファイルから自動抽出された body コンテンツ（手動編集不可避な場合はここを修正）',
        components: {
          Field: '@/components/MobileFullscreenEditor#MobileFullscreenEditor',
        },
      },
    },
    {
      name: 'embedCss',
      type: 'textarea',
      admin: {
        description: 'HTMLファイルから自動抽出された CSS スタイル（手動編集不可避な場合はここを修正）',
        components: {
          Field: '@/components/MobileFullscreenEditor#MobileFullscreenEditor',
        },
      },
    },
  ],
  upload: {
    mimeTypes: ['text/html'],
    allowRestrictedFileTypes: true,
  },
}
