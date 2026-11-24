/**
 * 記事の CSS（article.css）を、記事本文のコンテナだけに閉じ込める。
 *
 * article.css は手元プレビュー（単体の HTML ページ）でも使うので `html` / `body` / `:root` / `*` / `h1` などの
 * グローバルなセレクタを含む。そのまま読み込むとサイトのヘッダーやフッターまで変わる。
 * そこで全体を `@scope (.md-render) { ... }` で包む。@scope の中では次の2点が問題になる:
 *
 *  1. `html` / `body` / `:root` は、スコープの「祖先」なので何にもマッチしない
 *     → `:scope`（= コンテナ自身）に書き換える
 *  2. `.js-motion .reveal` のような「html に付く状態クラス」も祖先扱いでマッチしない
 *     → md-ui.js がコンテナにも状態クラスを付けるので、`:scope.js-motion .reveal` に書き換える
 *
 * @keyframes / @font-face などはスコープできない（グローバル）ので、@scope の外に出す。
 * パーサーは「コメント・文字列・波括弧」だけを追う軽量版（article.css の範囲を対象にしている）。
 */

export const MD_ROOT_CLASS = 'md-render'

/** html に付く状態クラス（md-ui.js が html とコンテナの両方に付ける） */
const STATE_CLASSES = ['js-motion', 'md-ready']

/** @scope の外に出す（グローバルな）at-rule */
const HOISTED_AT_RULES = ['keyframes', '-webkit-keyframes', 'font-face', 'property', 'counter-style']

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

const stateRe = new RegExp(`^\\.(${STATE_CLASSES.join('|')})(?![\\w-])`)

/** セレクタ1つ分（先頭の html / body / :root と、状態クラスだけ書き換える） */
export function scopeSelector(selector: string): string {
  const trimmed = selector.trim()
  if (!trimmed) return trimmed
  // html / body / :root（後ろに .class や [attr] や :pseudo が続いてもよい）
  const root = trimmed.match(/^(html|body|:root)(?![\w-])/i)
  if (root) return ':scope' + trimmed.slice(root[0].length)
  // 先頭が状態クラス（`.js-motion .reveal` → `:scope.js-motion .reveal`）
  const state = trimmed.match(stateRe)
  if (state) return ':scope' + trimmed
  return trimmed
}

function scopeRules(css: string, hoisted: string[]): string {
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
      // `@import` などの文。スコープの外では意味が変わるので、そのまま残す
      if (prelude) out += prelude + ';\n'
      i = j + 1
      continue
    }

    const blockEnd = findBlockEnd(css, j)
    const inner = css.slice(j + 1, blockEnd - 1)

    if (prelude.startsWith('@')) {
      const name = prelude.slice(1).split(/[\s({]/)[0].toLowerCase()
      if (HOISTED_AT_RULES.includes(name)) hoisted.push(`${prelude}{${inner}}`)
      else if (NESTED_AT_RULES.includes(name)) out += `${prelude}{\n${scopeRules(inner, hoisted)}}\n`
      else out += `${prelude}{${inner}}\n`
    } else {
      const selectors = splitSelectors(prelude).map(scopeSelector).join(', ')
      out += `${selectors}{${inner}}\n`
    }
    i = blockEnd
  }
  return out
}

/** article.css 全体を `.md-render` のスコープに閉じ込めた CSS にする */
export function scopeMarkdownCss(css: string, rootClass: string = MD_ROOT_CLASS): string {
  const hoisted: string[] = []
  const scoped = scopeRules(stripComments(css), hoisted)
  return `${hoisted.join('\n')}${hoisted.length ? '\n' : ''}@scope (.${rootClass}) {\n${scoped}}\n`
}
