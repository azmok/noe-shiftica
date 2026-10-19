export type ArticleHeading = {
  id: string
  text: string
  level: number
}

type LexicalNode = {
  type?: string
  tag?: string
  text?: string
  children?: LexicalNode[]
}

// Heading text → URL fragment. Keeps Japanese and other scripts readable
// (#問題の原因) so bookmarks survive headings being added elsewhere.
export function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'section'
}

function textOf(node: LexicalNode): string {
  if (typeof node.text === 'string') return node.text
  if (node.type === 'linebreak') return ' '
  return (node.children ?? []).map(textOf).join('')
}

export function extractHeadings(content: unknown): {
  headings: ArticleHeading[]
  idByNode: WeakMap<object, string>
} {
  const headings: ArticleHeading[] = []
  const idByNode = new WeakMap<object, string>()
  const used = new Set<string>()

  const walk = (node: LexicalNode) => {
    if (node.type === 'heading' && typeof node.tag === 'string' && /^h[1-6]$/.test(node.tag)) {
      const text = textOf(node).replace(/\s+/g, ' ').trim()
      if (text) {
        const base = slugifyHeading(text)
        let id = base
        for (let n = 2; used.has(id); n++) id = `${base}-${n}`
        used.add(id)
        idByNode.set(node, id)
        headings.push({ id, text, level: Number(node.tag.slice(1)) })
      }
      return
    }
    node.children?.forEach(walk)
  }

  const root = (content as { root?: LexicalNode } | null | undefined)?.root
  if (root) walk(root)
  return { headings, idByNode }
}
