/**
 * 保存前の前処理。noe-posts の .md はローカルプレビュー前提で書かれているため、
 * 本番の表示では不要（または二重になる）ものを markdownSource から落とす。
 *
 *   - 行頭の <link rel="stylesheet">（共通 CSS はページ側が読み込む）
 *   - 行頭の <script src="…_assets/…">（共通 JS はページ側が読み込む）
 *   - 冒頭の <h1>（タイトルはページ側が title から出す。残すと二重になる）
 *   - 行頭の HTML コメント
 *
 * `_assets` パスの書き換えは描画時（render.ts）に行う。原稿を元の形に近いまま持てるため。
 * コードフェンスの中は触らない。
 */
export function prepareMarkdownSource(markdown: string): string {
  const out: string[] = []
  let inFence = false
  let inComment = false
  let seenBody = false

  for (const line of markdown.split('\n')) {
    const t = line.trim()
    if (/^(```|~~~)/.test(t)) {
      inFence = !inFence
      seenBody = true
      out.push(line)
      continue
    }
    if (inFence) {
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
    if (/^<script\b[^>]*\bsrc=["'][^"']*_assets\/[^"']*["'][^>]*>\s*<\/script>$/i.test(t)) continue
    if (!seenBody && /^<h1\b[^>]*>[\s\S]*<\/h1>$/i.test(t)) {
      seenBody = true
      continue
    }
    if (t) seenBody = true
    out.push(line)
  }
  return out.join('\n').replace(/^\s*\n/, '')
}

/**
 * 本文中の相対パス画像（`./xxx.png`）を拾う。独立行の画像だけでなく、ai-box の中や
 * `<img src="./…">` も対象。`_assets` 配下（共通アセット）と URL は対象外。
 */
export function referencedMarkdownImages(markdown: string): string[] {
  const files = new Set<string>()
  let inFence = false
  const add = (raw: string) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|#|data:)/i.test(raw)) return
    if (/(^|\/)_assets\//.test(raw)) return
    let src = raw
    try {
      src = decodeURI(raw)
    } catch {
      // keep as written
    }
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(src)) files.add(src.replace(/^\.\//, ''))
  }
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    for (const m of line.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/g)) add(m[1])
    for (const m of line.matchAll(/<img\b[^>]*?\bsrc=["']([^"']+)["']/gi)) add(m[1])
  }
  return [...files]
}
