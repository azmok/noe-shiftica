/**
 * 記事ページの上書き CSS（article.css）を、記事ページ（`#article-page`）の中だけに効かせる。
 *
 * 全セレクタの頭に `#article-page` を付ける。ID が付くので、サイトの CSS（Tailwind・prose・
 * PostArticle.module.css）より必ず強くなり、上書きが確実に効く。ナビとフッターは
 * `#article-page` の外にあるので影響しない。
 *
 *   - `html` / `body` / `:root` で始まるセレクタは `#article-page` 自身に置き換える
 *     （`:root { --x }` の変数は記事ページの中だけで使える）
 *   - `@media` / `@supports` などの中も同じように変換する
 *   - `@keyframes` / `@font-face` / `@import` などはセレクタを持たないので、そのまま先頭に出す
 *
 * パーサーは「コメント・文字列・波括弧」だけを追う軽量版（article.css の範囲を対象にしている）。
 * noe-posts の Pythonista プレビュー（_tools/scope-css.js）も同じ規則で変換している。
 */

export const ARTICLE_ROOT = '#article-page'

export const MD_ROOT_CLASS = 'md-render'

/** セレクタを持たない（そのまま先頭に出す）at-rule */
const HOISTED_AT_RULES = ['keyframes', '-webkit-keyframes', 'font-face', 'property', 'counter-style', 'import', 'charset']

/** 中にルールを持つ at-rule（中身のセレクタを書き換える） */
const NESTED_AT_RULES = ['media', 'supports', 'layer', 'container']

/** コメントを落とす（文字列の中の /* は触らない） */
function stripComments(css: string): string {
  let out = ''
  let i = 0
  while (i < css.length) {
    const c = css[i]
    if (c === '"' || c === "'") {
      const end = findStringEnd(css, i)
      out += css.slice(i, end)
      i = end
    } else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? css.length : end + 2
    } else {
      out += c
      i++
    }
  }
  return out
}

function findStringEnd(css: string, start: number): number {
  const quote = css[start]
  let i = start + 1
  while (i < css.length) {
    if (css[i] === '\\') i += 2
    else if (css[i] === quote) return i + 1
    else i++
  }
  return css.length
}

/** start の位置の `{` に対応する `}` の次の位置 */
function findBlockEnd(css: string, start: number): number {
  let depth = 0
  let i = start
  while (i < css.length) {
    const c = css[i]
    if (c === '"' || c === "'") {
      i = findStringEnd(css, i)
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return i + 1
    }
    i++
  }
  return css.length
}

/** 括弧の外にあるカンマで分ける（`:not(a, b)` の中のカンマは分けない） */
function splitSelectors(list: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (let i = 0; i < list.length; i++) {
    const c = list[i]
    if (c === '"' || c === "'") {
      const end = findStringEnd(list, i)
      cur += list.slice(i, end)
      i = end - 1
      continue
    }
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    if (c === ',' && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

/** セレクタ1つ分に `root` を付ける（html / body / :root は root 自身に置き換える） */
export function scopeSelector(selector: string, root: string = ARTICLE_ROOT): string {
  const trimmed = selector.trim()
  if (!trimmed) return trimmed
  const top = trimmed.match(/^(html|body|:root)(?![\w-])/i)
  if (top) return root + trimmed.slice(top[0].length)
  return `${root} ${trimmed}`
}

function scopeRules(css: string, hoisted: string[], root: string): string {
  let out = ''
  let i = 0
  while (i < css.length) {
    // 先頭の空白を飛ばす
    while (i < css.length && /\s/.test(css[i])) i++
    if (i >= css.length) break

    // 次の `{` か `;` までが prelude
    let j = i
    while (j < css.length && css[j] !== '{' && css[j] !== ';') {
      if (css[j] === '"' || css[j] === "'") j = findStringEnd(css, j)
      else j++
    }
    const prelude = css.slice(i, j).trim()

    if (css[j] === ';' || j >= css.length) {
      // `@import` などの文は先頭に出す
      if (prelude) hoisted.push(prelude + ';')
      i = j + 1
      continue
    }

    const blockEnd = findBlockEnd(css, j)
    const inner = css.slice(j + 1, blockEnd - 1)

    if (prelude.startsWith('@')) {
      const name = prelude.slice(1).split(/[\s({]/)[0].toLowerCase()
      if (HOISTED_AT_RULES.includes(name)) hoisted.push(`${prelude}{${inner}}`)
      else if (NESTED_AT_RULES.includes(name)) out += `${prelude}{\n${scopeRules(inner, hoisted, root)}}\n`
      else out += `${prelude}{${inner}}\n`
    } else {
      const selectors = splitSelectors(prelude).map((sel) => scopeSelector(sel, root)).join(', ')
      out += `${selectors}{${inner}}\n`
    }
    i = blockEnd
  }
  return out
}

/** article.css 全体を、記事ページ（`#article-page`）の中だけに効く CSS にする */
export function scopeMarkdownCss(css: string, root: string = ARTICLE_ROOT): string {
  const hoisted: string[] = []
  const scoped = scopeRules(stripComments(css), hoisted, root)
  return `${hoisted.join('\n')}${hoisted.length ? '\n' : ''}${scoped}`
}
