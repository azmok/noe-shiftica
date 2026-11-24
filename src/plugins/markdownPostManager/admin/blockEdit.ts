/**
 * プレビューで直接書き換えた1ブロック（段落・見出し・表のセル）を、Markdown 原文に書き戻すための関数。
 * noe-posts の Netlify エディタ（_tools/editor.js）と同じ規則。DOM に触るのは inlineMarkdown だけ。
 */

/** 編集した要素の中身を Markdown（行内）に戻す。太字・斜体・コード・リンクは Markdown、それ以外の HTML はそのまま残す */
export function inlineMarkdown(node: Node): string {
  let out = ''
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      out += n.nodeValue ?? ''
      return
    }
    if (n.nodeType !== 1) return
    const el = n as Element
    const t = el.tagName
    if (t === 'STRONG' || t === 'B') out += '**' + inlineMarkdown(el) + '**'
    else if (t === 'EM' || t === 'I') out += '*' + inlineMarkdown(el) + '*'
    else if (t === 'CODE') out += '`' + (el.textContent ?? '') + '`'
    else if (t === 'A' && !el.getAttribute('class')) out += '[' + inlineMarkdown(el) + '](' + (el.getAttribute('href') ?? '') + ')'
    else if (t === 'BR') out += '<br>'
    else if (t === 'DIV' || t === 'P') out += (out ? '<br>' : '') + inlineMarkdown(el) // 編集中に勝手に入る改行用の箱
    else if ((t === 'SPAN' || t === 'FONT') && !el.getAttribute('class')) out += inlineMarkdown(el) // 編集中に勝手に入る装飾の箱
    else {
      const c = el.cloneNode(true) as Element
      c.removeAttribute('contenteditable')
      out += c.outerHTML
    }
  })
  return out
}

/** 改行やノーブレークスペースを、Markdown の1行に収まる形にそろえる */
export function normalizeInline(s: string): string {
  return s.replace(/ /g, ' ').replace(/\s*\n\s*/g, ' ').trim()
}

/** 表の1行（`| a | b |`）の col 番目のセルを差し替える（`\|` はセルの区切りとみなさない） */
export function replaceTableCell(row: string, col: number, text: string): string {
  const cells: string[] = []
  let cur = ''
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '\\' && i + 1 < row.length) {
      cur += row[i] + row[i + 1]
      i++
      continue
    }
    if (row[i] === '|') {
      cells.push(cur)
      cur = ''
    } else cur += row[i]
  }
  cells.push(cur)
  const lead = row.trim()[0] === '|' ? 1 : 0
  if (cells[col + lead] == null) return row
  cells[col + lead] = ' ' + text + ' '
  return cells.join('|')
}

export type BlockTarget = { src: [number, number] } | { row: number; col: number }

/** 書き換えた1ブロックを原文に反映した新しい原文を返す */
export function applyBlockEdit(raw: string, target: BlockTarget, text: string): string {
  const lines = raw.split('\n')
  if ('row' in target) {
    if (lines[target.row] == null) return raw
    lines[target.row] = replaceTableCell(lines[target.row], target.col, text.replace(/\|/g, '\\|'))
    return lines.join('\n')
  }
  const [start, stop] = target.src
  if (lines[start] == null) return raw
  // 行頭の印（引用の > / 見出しの # / リストの - や 1. / チェックボックス）はそのまま残す
  const prefix = (lines[start].match(/^(\s*(?:>\s?)*\s*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)?)/) ?? ['', ''])[1]
  let end = Math.min(stop, lines.length)
  while (end > start + 1 && !lines[end - 1].trim()) end-- // 末尾の空行は残す
  lines.splice(start, end - start, prefix + text)
  return lines.join('\n')
}

/** プレビューの要素から、書き戻し先（行番号やセル）を読む */
export function targetOf(el: Element): BlockTarget | null {
  if (el.hasAttribute('data-row')) return { row: Number(el.getAttribute('data-row')), col: Number(el.getAttribute('data-col')) }
  const src = el.getAttribute('data-src')
  if (!src) return null
  const [a, b] = src.split(':').map(Number)
  return Number.isFinite(a) && Number.isFinite(b) ? { src: [a, b] } : null
}
