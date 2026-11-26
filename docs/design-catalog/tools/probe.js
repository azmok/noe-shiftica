// ページ全体の役割（文字、余白、面、角丸）を測る。DevTools で関数として実行する。
async () => {
  await document.fonts.ready
  for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
  scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400))
  const seen = {}, out = []
  for (const e of document.querySelectorAll('body *')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META', 'PATH', 'BR', 'TEMPLATE'].includes(e.tagName.toUpperCase())) continue
    const r = e.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    const s = getComputedStyle(e)
    if (s.visibility === 'hidden') continue
    const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    const box = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.borderTopWidth !== '0px' || s.borderBottomWidth !== '0px' || s.borderRadius !== '0px' || s.boxShadow !== 'none'
    if (!own && !box && !['IMG', 'VIDEO', 'FIGURE', 'SECTION', 'HEADER', 'NAV', 'FOOTER', 'ARTICLE', 'MAIN'].includes(e.tagName)) continue
    const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).slice(0, 4).join('.') : ''
    const key = [e.tagName, cls, own ? [s.fontSize, s.lineHeight, s.fontWeight, s.color].join() : Math.round(r.width)].join('|')
    if (seen[key]) { seen[key].n++; continue }
    const rec = seen[key] = {
      el: e.tagName.toLowerCase() + (cls ? '.' + cls : ''), n: 1,
      at: [r.x, r.y + scrollY, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(' '),
      ...(own ? { font: `${s.fontSize}/${s.lineHeight} w${s.fontWeight} ls${s.letterSpacing}`, fam: s.fontFamily.slice(0, 60), color: s.color, t: e.textContent.trim().length + 'ch' } : {}),
      ...(box ? { bg: s.backgroundColor, bd: `${s.borderTopWidth}/${s.borderBottomWidth} ${s.borderBottomColor}`, rad: s.borderRadius, sh: s.boxShadow === 'none' ? undefined : s.boxShadow } : {}),
      ...(s.margin !== '0px' ? { m: s.margin } : {}), ...(s.padding !== '0px' ? { p: s.padding } : {}),
      ...(s.textTransform !== 'none' ? { tt: s.textTransform } : {}), ...(s.position !== 'static' && s.position !== 'relative' ? { pos: s.position } : {}),
    }
    out.push(rec)
  }
  const fonts = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight} ${f.style}`)
  return { w: innerWidth, dpr: devicePixelRatio, lang: document.documentElement.lang, bodyBg: getComputedStyle(document.body).backgroundColor, smoothing: getComputedStyle(document.body).webkitFontSmoothing, features: getComputedStyle(document.querySelector('p') || document.body).fontFeatureSettings, fonts: [...new Set(fonts)], h: document.body.scrollHeight, out }
}
