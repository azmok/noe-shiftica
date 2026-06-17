/**
 * assemble.ts
 *
 * 3分割（HTML / CSS / JS）のソースを 1枚の完全な HTML ドキュメントへ
 * 組み立てる純粋関数。サーバー（配信ルート）・クライアント（プレビュー）双方から利用する。
 *
 * - HTML セクションが既に <html> を含む完全文書の場合は、CSS を <head> に、
 *   JS を </body> 直前にインジェクトする。
 * - body のみ（断片）の場合は標準テンプレートで包む。
 */

export interface HostedSource {
  title?: string | null
  html?: string | null
  css?: string | null
  js?: string | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** </body> の直前に文字列を挿入。<body> が無ければ末尾へ。 */
function injectBeforeBodyClose(doc: string, snippet: string): string {
  if (/<\/body>/i.test(doc)) {
    return doc.replace(/<\/body>/i, `${snippet}\n</body>`)
  }
  return `${doc}\n${snippet}`
}

/** </head> の直前に文字列を挿入。<head> が無ければ <html ...> 直後、それも無ければ先頭へ。 */
function injectIntoHead(doc: string, snippet: string): string {
  if (/<\/head>/i.test(doc)) {
    return doc.replace(/<\/head>/i, `${snippet}\n</head>`)
  }
  if (/<html[^>]*>/i.test(doc)) {
    return doc.replace(/(<html[^>]*>)/i, `$1\n<head>\n${snippet}\n</head>`)
  }
  return `${snippet}\n${doc}`
}

/**
 * 3分割ソースを完全な HTML ドキュメント文字列へ組み立てる。
 */
export function assembleHtmlDocument(src: HostedSource): string {
  const title = (src.title ?? '').trim() || 'Untitled'
  const html = (src.html ?? '').trim()
  const css = (src.css ?? '').trim()
  const js = (src.js ?? '').trim()

  const styleTag = css ? `<style>\n${css}\n</style>` : ''
  const scriptTag = js ? `<script>\n${js}\n</script>` : ''

  // HTML セクションが完全文書なら、その中へインジェクトして返す
  if (/<html[\s>]/i.test(html)) {
    let doc = html
    if (styleTag) doc = injectIntoHead(doc, styleTag)
    if (scriptTag) doc = injectBeforeBodyClose(doc, scriptTag)
    if (!/<!doctype/i.test(doc)) doc = `<!DOCTYPE html>\n${doc}`
    return doc
  }

  // body 断片 → 標準テンプレートで包む
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
${styleTag}
</head>
<body>
${html}
${scriptTag}
</body>
</html>`
}
