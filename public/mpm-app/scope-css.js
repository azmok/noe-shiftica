/*
 * scope-css.js — article.css（上書き）の全セレクタに `#article-page` を付ける。
 * サイト側の noe-shiftica/src/plugins/markdownRender/scopeCss.ts と同じ規則（どちらかを直したら両方直す）。
 *   - html / body / :root で始まるセレクタは #article-page 自身に置き換える
 *   - @media / @supports などの中も変換する。@keyframes / @import などはそのまま先頭に出す
 */
(function (global) {
  'use strict'
  var HOISTED = ['keyframes', '-webkit-keyframes', 'font-face', 'property', 'counter-style', 'import', 'charset']
  var NESTED = ['media', 'supports', 'layer', 'container']

  function stringEnd(css, start) {
    var q = css[start], i = start + 1
    while (i < css.length) {
      if (css[i] === '\\') i += 2
      else if (css[i] === q) return i + 1
      else i++
    }
    return css.length
  }
  function stripComments(css) {
    var out = '', i = 0
    while (i < css.length) {
      var c = css[i]
      if (c === '"' || c === "'") { var e = stringEnd(css, i); out += css.slice(i, e); i = e }
      else if (c === '/' && css[i + 1] === '*') { var end = css.indexOf('*/', i + 2); i = end === -1 ? css.length : end + 2 }
      else { out += c; i++ }
    }
    return out
  }
  function blockEnd(css, start) {
    var depth = 0, i = start
    while (i < css.length) {
      var c = css[i]
      if (c === '"' || c === "'") { i = stringEnd(css, i); continue }
      if (c === '{') depth++
      else if (c === '}') { depth--; if (depth === 0) return i + 1 }
      i++
    }
    return css.length
  }
  function splitSelectors(list) {
    var out = [], depth = 0, cur = ''
    for (var i = 0; i < list.length; i++) {
      var c = list[i]
      if (c === '"' || c === "'") { var e = stringEnd(list, i); cur += list.slice(i, e); i = e - 1; continue }
      if (c === '(' || c === '[') depth++
      else if (c === ')' || c === ']') depth--
      if (c === ',' && depth === 0) { out.push(cur); cur = '' } else cur += c
    }
    out.push(cur)
    return out
  }
  function scopeSelector(sel, root) {
    var t = sel.trim()
    if (!t) return t
    var m = t.match(/^(html|body|:root)(?![\w-])/i)
    if (m) return root + t.slice(m[0].length)
    return root + ' ' + t
  }
  function scopeRules(css, hoisted, root) {
    var out = '', i = 0
    while (i < css.length) {
      while (i < css.length && /\s/.test(css[i])) i++
      if (i >= css.length) break
      var j = i
      while (j < css.length && css[j] !== '{' && css[j] !== ';') {
        if (css[j] === '"' || css[j] === "'") j = stringEnd(css, j); else j++
      }
      var prelude = css.slice(i, j).trim()
      if (css[j] === ';' || j >= css.length) { if (prelude) hoisted.push(prelude + ';'); i = j + 1; continue }
      var end = blockEnd(css, j), inner = css.slice(j + 1, end - 1)
      if (prelude[0] === '@') {
        var name = prelude.slice(1).split(/[\s({]/)[0].toLowerCase()
        if (HOISTED.indexOf(name) >= 0) hoisted.push(prelude + '{' + inner + '}')
        else if (NESTED.indexOf(name) >= 0) out += prelude + '{\n' + scopeRules(inner, hoisted, root) + '}\n'
        else out += prelude + '{' + inner + '}\n'
      } else {
        out += splitSelectors(prelude).map(function (s) { return scopeSelector(s, root) }).join(', ') + '{' + inner + '}\n'
      }
      i = end
    }
    return out
  }
  function scopeCss(css, root) {
    root = root || '#article-page'
    var hoisted = []
    var scoped = scopeRules(stripComments(css), hoisted, root)
    return (hoisted.length ? hoisted.join('\n') + '\n' : '') + scoped
  }
  global.scopeCss = scopeCss
})(typeof window !== 'undefined' ? window : globalThis)
