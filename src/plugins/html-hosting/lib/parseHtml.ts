/**
 * parseHtml.ts
 *
 * アップロードされた 1枚の HTML ファイルを CSS / HTML / JS の3要素へ分解する純粋関数。
 *
 * 方針:
 *  - <style> ブロックの中身 → CSS
 *  - インライン <script>（src 無し）の中身 → JS
 *  - 外部リソース（<link rel="stylesheet">, <script src=...>）は配信時も読み込めるよう
 *    HTML セクションへ温存する
 *  - <body> があればその内側を、無ければ html/head/body ラッパーを除去した残りを HTML とする
 */

export interface ParsedHtml {
  html: string
  css: string
  js: string
}

export function parseHtmlFile(raw: string): ParsedHtml {
  let work = raw ?? ''
  const cssParts: string[] = []
  const jsParts: string[] = []

  // 1. <style> ブロックを抽出して除去
  work = work.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_full, inner) => {
    const trimmed = String(inner).trim()
    if (trimmed) cssParts.push(trimmed)
    return ''
  })

  // 2. インライン <script>（src 無し）を抽出して除去。外部 script はそのまま残す
  work = work.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, inner) => {
    if (/\bsrc\s*=/i.test(String(attrs))) return full // 外部スクリプトは HTML 側に温存
    const trimmed = String(inner).trim()
    if (trimmed) jsParts.push(trimmed)
    return ''
  })

  // 3. HTML 本体を決定
  let html: string
  const bodyMatch = work.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    // <head> 内の外部スタイルシート / 外部スクリプトを温存
    let preserved = ''
    const headMatch = work.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
    if (headMatch) {
      const matches = headMatch[1].match(
        /<link[^>]+rel=["']?stylesheet["']?[^>]*>|<script\b[^>]*\bsrc=[^>]*>\s*<\/script>/gi,
      )
      if (matches) preserved = matches.join('\n') + '\n'
    }
    html = preserved + bodyMatch[1].trim()
  } else {
    // ラッパータグだけ除去
    html = work.replace(/<\/?(?:html|head|body)[^>]*>/gi, '').trim()
  }

  return {
    html: html.trim(),
    css: cssParts.join('\n\n').trim(),
    js: jsParts.join('\n\n').trim(),
  }
}
