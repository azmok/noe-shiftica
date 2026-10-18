/**
 * AI 投稿（/api/ai/posts）用の Markdown 前処理と、画像の Lexical 埋め込み。
 *
 * 記事フォルダの .md はローカルプレビュー前提で書かれているため、投稿前に次を落とす:
 *   - 冒頭の <link rel="stylesheet">（本番では無意味）
 *   - 冒頭の <h1>（タイトルはページ側が title から H1 として出す。残すと二重になる）
 *   - 行頭の HTML コメント（画像生成用のメモ）
 *   - X 埋め込みの <script src=".../widgets.js">（フロントの TwitterEmbedLoader が読み込む）
 * 独立行の画像 `![alt](./file.png)` はプレースホルダー段落に置き換え、変換後に media の
 * upload ノードへ差し替える。プレースホルダーは Markdown として無害な英数字だけにする
 * （markdownImport の OJECODEBLOCKPLACEHOLDER と同じ方針）。
 */

export interface ArticleImageRef {
  /** Markdown に書かれた参照先（先頭の ./ を除いたもの） */
  src: string
  /** 画像の alt。空ならファイル名（拡張子なし） */
  alt: string
}

const PLACEHOLDER_RE = /^MDIMAGEPLACEHOLDER(\d+)END$/

const placeholder = (index: number) => `MDIMAGEPLACEHOLDER${index}END`

const stripExtension = (name: string) => name.replace(/\.[^./]+$/, '')

const baseName = (p: string) => p.split('/').pop() ?? p

function decodePath(p: string): string {
  try {
    return decodeURI(p)
  } catch {
    return p
  }
}

/** 投稿に不要な要素を落とし、画像行をプレースホルダーに置き換える */
export function prepareArticleMarkdown(markdown: string): {
  markdown: string
  images: ArticleImageRef[]
} {
  const images: ArticleImageRef[] = []
  const out: string[] = []
  let inFence = false
  let inComment = false

  for (const line of markdown.split('\n')) {
    const t = line.trim()
    if (/^```/.test(t)) inFence = !inFence
    if (inFence || /^```/.test(t)) {
      out.push(line)
      continue
    }
    if (inComment) {
      if (t.includes('-->')) inComment = false
      continue
    }
    if (/^<!--/.test(t)) {
      if (!t.includes('-->')) inComment = true
      continue
    }
    if (/^<link\b[^>]*rel=["']?stylesheet/i.test(t)) continue
    if (/^<h1\b[^>]*>[\s\S]*<\/h1>$/i.test(t)) continue
    if (/^<script\b[^>]*platform\.twitter\.com\/widgets\.js[^>]*>\s*<\/script>$/i.test(t)) continue

    const img = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (img) {
      const src = decodePath(img[2]).replace(/^\.\//, '')
      const alt = img[1].trim() || stripExtension(baseName(src))
      images.push({ src, alt })
      out.push('', placeholder(images.length - 1), '')
      continue
    }
    out.push(line)
  }

  return { markdown: out.join('\n'), images }
}

interface LexicalNode {
  type?: string
  text?: unknown
  children?: LexicalNode[]
  [key: string]: unknown
}

/**
 * プレースホルダー段落を media の upload ノードに差し替える（lexical を直接書き換えて返す）。
 * mediaIds[i] が images[i] に対応する。差し替え漏れがあれば例外にする。
 */
export function replaceImagePlaceholders<T extends { root?: LexicalNode }>(
  lexical: T,
  mediaIds: Array<number | string>,
): T {
  const visit = (node: LexicalNode | undefined) => {
    if (!node || !Array.isArray(node.children)) return
    node.children = node.children.map((child) => {
      const only = child?.type === 'paragraph' && child.children?.length === 1 ? child.children[0] : null
      const match = only?.type === 'text' && typeof only.text === 'string' ? only.text.match(PLACEHOLDER_RE) : null
      if (match) {
        const id = mediaIds[Number(match[1])]
        if (id === undefined) throw new Error(`No uploaded media for image placeholder #${match[1]}`)
        return { type: 'upload', relationTo: 'media', value: id, fields: null, format: '', version: 3 }
      }
      visit(child)
      return child
    })
  }
  visit(lexical.root)

  const leftover = JSON.stringify(lexical).match(/MDIMAGEPLACEHOLDER\d+END/)
  if (leftover) throw new Error(`Image placeholder could not be replaced: ${leftover[0]}`)
  return lexical
}
