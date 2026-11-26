/*
 * editor.js — Noe Editor（本番そっくりプレビュー ＋ 文章のクリック編集 ＋ 見た目の GUI 編集）
 *
 * 表示：プレビュー / 並べて（スクロール連動）/ MD
 * モード：見るだけ / ✏️ 文章（クリックしてその場で書き換え → .md の該当行に戻す）/ 🎨 スタイル（article.css）
 * 読み書き先は store.js（手元の preview_server.py か、GitHub）。
 *
 * しくみ
 *   - 記事は本番の記事ページの型（_assets/site/page-*.html）に、本物の CSS と article.css（#article-page 付き）
 *     を重ねて表示する。本番と同じ markdown-it で描く。
 *   - 描いた要素には「.md の何行目から来たか」（data-src="開始:終了"、表のセルは data-row / data-col）を付ける。
 *     クリック編集はその行だけを書き換え、スクロール連動もこの印を使う。
 *   - iPad の中のブラウザは iframe の中を指でスクロールしにくいので、iframe を記事の高さまで伸ばし、外側の枠をスクロールさせる。
 */
(function () {
  'use strict'

  var $ = function (s) { return document.querySelector(s) }
  var store = window.NoeStore
  var ROOT = '#article-page'
  var GUI_BEGIN = '/* @gui-begin'
  var GUI_END = '/* @gui-end */'
  var MEDIA = { all: null, mobile: '@media (max-width: 767.98px)', desktop: '@media (min-width: 768px)' }

  var state = {
    path: null, raw: '', crlf: false, fmLines: 0, front: {},
    articleCss: '', edits: [], history: [],
    el: null, selector: null, media: 'all', width: 1280,
    view: 'preview', mode: null,
    dirtyMd: false, dirtyCss: false, originalMd: '', pendingImages: {},
  }
  var cache = {}   // 型・本物の CSS・共通 JS の中身

  // ================================================================ 便利関数
  function status(msg, kind) { var s = $('#status'); s.textContent = msg || ''; s.className = 'status ' + (kind || '') }
  function remember(k, v) { try { localStorage.setItem('noe-editor:' + k, v) } catch (e) {} }
  function load(k) { try { return localStorage.getItem('noe-editor:' + k) } catch (e) { return null } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag)
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]
      else if (k === 'html') e.innerHTML = attrs[k]
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k])
      else e.setAttribute(k, attrs[k])
    })
    ;(kids || []).forEach(function (c) { if (c) e.appendChild(c) })
    return e
  }
  async function cached(path) { if (cache[path] == null) cache[path] = await store.read(path); return cache[path] }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a) }, ms) } }

  // ================================================================ .md の読み取り（行番号を保つ）
  function splitFront(raw) {
    var m = raw.match(/^﻿?\s*---\n([\s\S]*?)\n---\n?/)
    var front = {}
    if (!m) return { front: front, body: raw, fmLines: 0 }
    m[1].split('\n').forEach(function (line) {
      var kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
      if (kv) front[kv[1]] = kv[2].replace(/\s+#.*$/, '').trim().replace(/^["'“]|["'”]$/g, '')
    })
    return { front: front, body: raw.slice(m[0].length), fmLines: m[0].split('\n').length - 1 }
  }
  /** 本番の prepareMarkdownSource と同じものを落とす。ただし行を消さずに空行にして、行番号を保つ */
  function prepareKeepLines(markdown) {
    var inFence = false, inComment = false, seenBody = false
    return markdown.split('\n').map(function (line) {
      var t = line.trim()
      if (/^(```|~~~)/.test(t)) { inFence = !inFence; seenBody = true; return line }
      if (inFence) return line
      if (inComment) { if (t.indexOf('-->') >= 0) inComment = false; return '' }
      if (/^<!--/.test(t)) { if (t.indexOf('-->') < 0) inComment = true; return '' }
      if (/^<link\b[^>]*rel=["']?stylesheet/i.test(t)) return ''
      if (/^<script\b[^>]*\bsrc=["'][^"']*_assets\/[^"']*["'][^>]*>\s*<\/script>$/i.test(t)) return ''
      if (!seenBody && /^<h1\b[^>]*>[\s\S]*<\/h1>$/i.test(t)) { seenBody = true; return '' }
      if (t) seenBody = true
      return line
    }).join('\n')
  }
  function slugifyHeading(text) {
    var slug = text.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
    return slug || 'section'
  }

  // ================================================================ 描画（本番の render.ts と同じ規則 ＋ 行番号の印）
  var md = window.markdownit({ html: true, linkify: true, typographer: false })
  md.renderer.rules.paragraph_open = function (tokens, idx, options, env, self) {
    var t = tokens[idx]
    if (t.hidden) return env.spans && t.attrGet('data-src') ? '<span class="noe-tight" data-src="' + t.attrGet('data-src') + '">' : ''
    return self.renderToken(tokens, idx, options)
  }
  md.renderer.rules.paragraph_close = function (tokens, idx, options, env, self) {
    var t = tokens[idx]
    if (t.hidden) return env.spans && t.meta && t.meta.span ? '</span>' : ''
    return self.renderToken(tokens, idx, options)
  }

  function render(body, dirPath, off, spans) {
    var used = {}, headings = [], env = { spans: spans }
    var tokens = md.parse(body, env), row = -1, col = 0, openHidden = []
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i]
      if ((t.type === 'paragraph_open' || t.type === 'heading_open') && t.map) t.attrSet('data-src', (t.map[0] + off) + ':' + (t.map[1] + off))
      if (t.type === 'paragraph_open' && t.hidden) openHidden.push(t.level)
      if (t.type === 'paragraph_close' && t.hidden && openHidden.length && openHidden[openHidden.length - 1] === t.level) { openHidden.pop(); t.meta = { span: true } }
      if (t.type === 'tr_open' && t.map) { row = t.map[0] + off; col = 0 }
      if ((t.type === 'th_open' || t.type === 'td_open') && row >= 0) { t.attrSet('data-row', row); t.attrSet('data-col', col++) }
      if (t.type !== 'heading_open') continue
      var text = ((tokens[i + 1] && tokens[i + 1].children) || []).filter(function (c) { return c.type === 'text' || c.type === 'code_inline' })
        .map(function (c) { return c.content }).join('').replace(/\s+/g, ' ').trim()
      if (!text) continue
      var base = slugifyHeading(text), id = base
      for (var n = 2; used[id]; n++) id = base + '-' + n
      used[id] = true
      t.attrSet('id', id); t.attrSet('data-heading-id', id)
      headings.push({ id: id, text: text, level: Number(t.tag.slice(1)) })
    }
    // 共通アセットと記事の画像は、あとで読み書き先の URL に差し替える（noe-asset: の印）
    // （直前が空白の src / href だけ。data-src="開始:終了" の印は書き換えない）
    var html = md.renderer.render(tokens, md.options, env).replace(/(\s)(src|href)=("([^"]*)"|'([^']*)')/g, function (all, sp, attr, quoted, dq, sq) {
      var v = dq != null ? dq : sq, q = quoted[0], next = v
      var asset = v.match(/^(?:\.{1,2}\/)+_assets\/(.*)$/)
      if (asset) next = 'noe-asset:_assets/' + asset[1]
      else if (attr === 'src' && !/^(?:[a-z][a-z0-9+.-]*:|\/|#|data:)/i.test(v)) {
        var file = v.replace(/^\.\//, ''); try { file = decodeURI(file) } catch (e) {}
        next = 'noe-asset:' + dirPath + '/' + file
      }
      return next === v ? all : sp + attr + '=' + q + next + q
    })
    return { html: html, headings: headings }
  }
  function previewAsset(path) {
    var pending = state.pendingImages[path]
    return pending ? Promise.resolve('data:image/webp;base64,' + pending) : store.assetUrl(path)
  }
  async function resolveAssets(html) {
    var paths = {}, re = /noe-asset:([^"'\s)]+)/g, m
    while ((m = re.exec(html))) paths[m[1]] = 1
    var map = {}
    await Promise.all(Object.keys(paths).map(async function (p) { map[p] = await previewAsset(p) }))
    return html.replace(/noe-asset:([^"'\s)]+)/g, function (_, p) { return map[p] || '' })
  }

  // ================================================================ 本番の型に流し込む
  function renderHero(doc, hero, title) {
    doc.querySelectorAll('[data-slot="hero"]').forEach(function (slot) {
      var media = slot.firstElementChild
      if (!hero) {
        // Match BlogFallbackHero in the static preview, where React is unavailable.
        var fallback = doc.createElement('div')
        fallback.style.cssText = 'position:relative;width:100%;height:100%;min-height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#e0e5ec;border-radius:12px;overflow:hidden;font-family:var(--font-sans, sans-serif)'
        fallback.innerHTML = [
          '<svg aria-hidden="true" viewBox="0 0 800 400" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.6">',
          '<g fill="none" stroke="#a3b1c6" stroke-width="2" stroke-linecap="round" stroke-dasharray="1000" style="filter:blur(1px)">',
          '<path d="M100,200 C150,100 300,300 400,200 S650,100 700,200"><animate attributeName="stroke-dashoffset" values="1000;0;1000" dur="20s" repeatCount="indefinite"/></path>',
          '<path d="M200,350 Q400,150 600,350" opacity=".3"><animate attributeName="stroke-dashoffset" values="1000;0;1000" begin="-2s" dur="20s" repeatCount="indefinite"/></path>',
          '</g></svg>',
          '<span aria-hidden="true" style="position:absolute;top:15%;right:15%;width:12px;height:12px;border-radius:50%;box-shadow:inset 2px 2px 5px #a3b1c6,inset -2px -2px 5px #fff;display:grid;place-items:center"><span style="width:4px;height:4px;border-radius:50%;background:#4caf50;box-shadow:0 0 10px #4caf50"></span></span>',
          '<div style="color:#e0e5ec;font-size:clamp(2.5rem,8vw,5rem);font-weight:900;letter-spacing:-.05em;line-height:1;text-transform:uppercase;text-shadow:2px 2px 3px #a3b1c6,-2px -2px 3px #fff">Noe Shiftica</div>',
          '<div style="margin-top:24px;font-size:.7rem;font-weight:700;letter-spacing:.5em;text-transform:uppercase">Cognitive Architecture</div>'
        ].join('')
        media.replaceWith(fallback)
        return
      }
      var img = media.matches('img') ? media : media.querySelector('img')
      if (!img) {
        img = doc.createElement('img')
        img.style.cssText = 'width:100%;height:100%;object-fit:contain'
        media.replaceWith(img)
      }
      img.removeAttribute('srcset')
      img.removeAttribute('sizes')
      img.style.removeProperty('background-image')
      img.alt = title
      var pic = img.closest('picture')
      if (pic) pic.querySelectorAll('source').forEach(function (source) { source.remove() })
      img.src = hero
    })
  }
  function rebuildToc(doc, headings) {
    doc.querySelectorAll('[data-slot="toc"] ol, .article-toc-sidebar ol, .article-toc-sidebar ul').forEach(function (list) {
      var items = Array.prototype.slice.call(list.children).filter(function (li) { return li.querySelector('a[href^="#"]') })
      if (!items.length) return
      var indent = function (li) { return /\bpl-|\bml-/.test(li.className) }
      var p2 = items.find(function (li) { return !indent(li) }) || items[0], p3 = items.find(indent) || p2
      items.forEach(function (li) { li.remove() })
      headings.filter(function (h) { return h.level === 2 || h.level === 3 }).forEach(function (h) {
        var li = (h.level === 3 ? p3 : p2).cloneNode(true), a = li.querySelector('a[href^="#"]')
        a.setAttribute('href', '#' + h.id); a.textContent = h.text; a.removeAttribute('data-active'); a.removeAttribute('aria-current')
        list.appendChild(li)
      })
    })
  }
  async function buildDoc() {
    var dirPath = state.path.split('/').slice(0, -1).join('/')
    var parts = splitFront(state.raw)
    state.front = parts.front; state.fmLines = parts.fmLines
    var rendered = render(prepareKeepLines(parts.body), dirPath, parts.fmLines, state.mode === 'text')
    var html = await resolveAssets(rendered.html)
    var kind = state.path.indexOf('blog/') === 0 ? 'blog' : 'dev'
    var doc = new DOMParser().parseFromString(await cached('_assets/site/page-' + kind + '.html'), 'text/html')
    // 本物の CSS は中身を直接埋め込む（GitHub から読むときは URL で参照できないため）
    var links = Array.prototype.slice.call(doc.querySelectorAll('link[rel="stylesheet"][href]'))
    for (var li = 0; li < links.length; li++) {
      var href = links[li].getAttribute('href')
      if (/^(https?:|\/)/.test(href)) continue
      var st = doc.createElement('style'); st.textContent = await cached('_assets/site/' + href); links[li].replaceWith(st)
    }
    var title = parts.front.title || ''
    doc.querySelectorAll('[data-slot="title"]').forEach(function (e) { e.textContent = title })
    doc.querySelectorAll('[data-slot="description"]').forEach(function (e) { e.textContent = parts.front.description || '' })
    doc.querySelectorAll('[data-slot="body"]').forEach(function (e, i) {
      var h = i === 0 ? html : html.replace(/ id="[^"]*" data-heading-id=/g, ' data-heading-id=')
      e.innerHTML = '<div class="md-render" data-md-root>' + h + '</div>'
    })
    var heroSrc = parts.front.hero || parts.front.heroImage || parts.front.image || parts.front.cover
    var hero = heroSrc && (/^https?:/.test(heroSrc) ? heroSrc : await previewAsset(dirPath + '/' + heroSrc.replace(/^\.\//, '')))
    renderHero(doc, hero, title)
    rebuildToc(doc, rendered.headings)
    if (title) doc.title = title
    ;['__overrides', '__gui'].forEach(function (id) { var s = doc.createElement('style'); s.id = id; doc.head.appendChild(s) })
    var hl = doc.createElement('style'); hl.id = '__hl'
    hl.textContent = 'html,body{overflow:visible!important}'
      + '[data-noe-sel]{outline:2px solid #4aa8ff!important;outline-offset:2px!important}[data-noe-match]{outline:1px dashed rgba(74,168,255,.7)!important}'
      + 'body.noe-text [data-src]:not(div):hover,body.noe-text [data-row]:hover{outline:1px dashed rgba(204,221,0,.7);outline-offset:3px;cursor:text}'
      + '[contenteditable=true]{outline:2px solid #ccdd00!important;outline-offset:4px;background:rgba(204,221,0,.06)!important;cursor:text}'
    doc.head.appendChild(hl)
    var jsFiles = ['term-note.js', 'md-ui.js']
    for (var ji = 0; ji < jsFiles.length; ji++) { var sc = doc.createElement('script'); sc.textContent = await cached('_assets/md/' + jsFiles[ji]); doc.body.appendChild(sc) }
    if (state.mode === 'text') doc.body.classList.add('noe-text')
    return '<!doctype html>\n' + doc.documentElement.outerHTML
  }

  // ================================================================ iframe とスクロール
  var frame = $('#frame')
  function fdoc() { return frame.contentDocument }
  function scale() { return Math.min(1, $('#stage').clientWidth / state.width) }
  var contentH = 0, fitQueued = false
  function measure(reset) {
    var d = fdoc(); if (!d || !d.documentElement) return 0
    if (reset) frame.style.height = $('#stage').clientHeight + 'px'
    return Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0)
  }
  function fitStage(reset) {
    var s = scale(), h = measure(reset) || $('#stage').clientHeight
    contentH = h
    frame.style.width = state.width + 'px'; frame.style.height = h + 'px'
    $('#frameWrap').style.transform = 'scale(' + s + ')'
    $('#sizer').style.width = Math.round(state.width * s) + 'px'; $('#sizer').style.height = Math.round(h * s) + 'px'
  }
  function scheduleFit() {
    if (fitQueued) return
    fitQueued = true
    requestAnimationFrame(function () { fitQueued = false; if (fdoc() && Math.abs(measure(false) - contentH) > 2) fitStage(false) })
  }

  async function renderPreview() {
    var y = $('#stage').scrollTop
    try {
      var html = await buildDoc()
      await new Promise(function (resolve) {
        frame.onload = function () {
          applyCss(); hookFrame(); fitStage(true); $('#stage').scrollTop = y
          try { new ResizeObserver(scheduleFit).observe(fdoc().body) } catch (e) {}
          fdoc().addEventListener('load', scheduleFit, true)
          setTimeout(function () { fitStage(false) }, 800)
          if (state.selector && state.mode === 'style') markSelector(state.selector)
          resolve()
        }
        frame.srcdoc = html
      })
    } catch (e) { status('表示できませんでした：' + e.message, 'err') }
  }
  var renderSoon = debounce(renderPreview, 600)

  async function openArticle(path) {
    if (state.dirtyMd && !confirm('保存していない記事の変更があります。破棄して開きますか？')) return
    closeDrawer()
    status('読み込み中…')
    try {
      var raw = await store.read(path)
      state.crlf = raw.indexOf('\r\n') >= 0
      state.raw = raw.replace(/\r\n/g, '\n'); state.path = path; state.dirtyMd = false; markDirty()
      state.originalMd = state.raw
      state.pendingImages = {}
      remember('article', path)
      $('#articleName').textContent = path.split('/').pop().replace(/\.md$/, '')
      state.front = splitFront(state.raw).front
      priorities[path] = normPriority(state.front.priority); savePriorities()
      $('#priority').value = priorities[path] || ''
      await fillBranches(path)
      renderArticleList()
      updateGhLink()
      $('#mdText').value = state.raw
      $('#stage').scrollTop = 0; $('#mdText').scrollTop = 0
      await renderPreview()
      buildMirror()
      if (state.view === 'diff') renderDiff()
      status('')
    } catch (e) { status('読み込めませんでした：' + e.message, 'err') }
  }

  function hookFrame() {
    var d = fdoc()
    d.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a')
      if (state.mode === 'style') { ev.preventDefault(); ev.stopPropagation(); pick(ev.target); return }
      if (state.mode === 'text') {
        if (editing && editing.contains(ev.target)) { if (a) ev.preventDefault(); return }
        var target = ev.target.closest && ev.target.closest('p[data-src], h1[data-src], h2[data-src], h3[data-src], h4[data-src], h5[data-src], h6[data-src], span.noe-tight[data-src], td[data-row], th[data-row]')
        if (a || target) ev.preventDefault()
        if (target) { if (editing) commitEdit(); startEdit(target) }
        return
      }
      if (a) {
        ev.preventDefault()
        var href = a.getAttribute('href') || ''
        if (href[0] === '#') { var t = visibleById(decodeURIComponent(href.slice(1))); if (t) scrollStageTo(absTop(t)) }
      }
    }, true)
  }
  /** 見出しはスマホ用（id）とPC用（data-heading-id）の2か所にあるので、いま見えている方を返す */
  function visibleById(id) {
    var all = fdoc().querySelectorAll('[id], [data-heading-id]')
    for (var i = 0; i < all.length; i++) if ((all[i].id === id || all[i].getAttribute('data-heading-id') === id) && all[i].getClientRects().length) return all[i]
    return null
  }
  function absTop(node) { var r = node.getBoundingClientRect(), d = fdoc(); return r.top + (d.scrollingElement ? d.scrollingElement.scrollTop : 0) }
  function scrollStageTo(y) { $('#stage').scrollTo({ top: Math.max(0, y * scale() - 20), behavior: 'smooth' }) }

  // ================================================================ ✏️ 文章のクリック編集
  var editing = null, editingOriginal = ''
  function startEdit(target) {
    editing = target; editingOriginal = target.innerHTML
    target.contentEditable = 'true'; target.focus()
    textbarState(true)
    target.addEventListener('keydown', onEditKey)
  }
  function onEditKey(ev) {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); commitEdit() }
    else if (ev.key === 'Escape') { ev.preventDefault(); cancelEdit() }
    else if (ev.key === 'Enter' && ev.shiftKey) { ev.preventDefault(); fdoc().execCommand('insertLineBreak') }
  }
  function endEdit() {
    if (!editing) return
    editing.removeEventListener('keydown', onEditKey); editing.removeAttribute('contenteditable')
    editing = null; textbarState(false)
  }
  /** 帯のボタンは、文字を編集しているときだけ押せる */
  function textbarState(on) {
    document.querySelectorAll('#textbar button').forEach(function (b) { b.disabled = !on })
    $('#textbarHint').textContent = on ? 'Enter で確定 / Shift+Enter で改行 / Esc で取り消し' : '書き換えたい段落・見出し・表のセルをタップしてください'
  }
  function cancelEdit() { if (!editing) return; editing.innerHTML = editingOriginal; endEdit() }

  /** 編集した要素の中身を Markdown（行内）に戻す。太字・斜体・コード・リンクは Markdown、それ以外の HTML はそのまま残す */
  function inlineMd(node) {
    var out = ''
    node.childNodes.forEach(function (n) {
      if (n.nodeType === 3) { out += n.nodeValue; return }
      if (n.nodeType !== 1) return
      var t = n.tagName
      if (t === 'STRONG' || t === 'B') out += '**' + inlineMd(n) + '**'
      else if (t === 'EM' || t === 'I') out += '*' + inlineMd(n) + '*'
      else if (t === 'CODE') out += '`' + n.textContent + '`'
      else if (t === 'A' && !n.getAttribute('class')) out += '[' + inlineMd(n) + '](' + (n.getAttribute('href') || '') + ')'
      else if (t === 'BR') out += '<br>'
      else if (t === 'DIV' || t === 'P') out += (out ? '<br>' : '') + inlineMd(n)   // 編集中に勝手に入る改行用の箱
      else if ((t === 'SPAN' || t === 'FONT') && !n.getAttribute('class')) out += inlineMd(n)   // 編集中に勝手に入る装飾の箱
      else { var c = n.cloneNode(true); c.removeAttribute('contenteditable'); out += c.outerHTML }
    })
    return out
  }
  function normInline(s) { return s.replace(/ /g, ' ').replace(/\s*\n\s*/g, ' ').trim() }
  function commitEdit() {
    if (!editing) return
    var target = editing, text = normInline(inlineMd(target)), original = editingOriginal
    endEdit()
    var tmp = document.createElement('div'); tmp.innerHTML = original
    if (normInline(inlineMd(tmp)) === text) return   // 変わっていない
    var lines = state.raw.split('\n')
    if (target.hasAttribute('data-row')) {
      var ln = Number(target.getAttribute('data-row')), col = Number(target.getAttribute('data-col'))
      lines[ln] = replaceCell(lines[ln], col, text.replace(/\|/g, '\\|'))
    } else {
      var r = target.getAttribute('data-src').split(':').map(Number)
      var prefix = ((lines[r[0]] || '').match(/^(\s*(?:>\s?)*\s*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)?)/) || ['', ''])[1]
      var end = r[1]
      while (end > r[0] + 1 && !lines[end - 1].trim()) end--   // 末尾の空行は残す
      lines.splice(r[0], end - r[0], prefix + text)
    }
    setRaw(lines.join('\n'), true)
  }
  function replaceCell(row, col, text) {
    var cells = [], cur = ''
    for (var i = 0; i < row.length; i++) {
      if (row[i] === '\\' && i + 1 < row.length) { cur += row[i] + row[i + 1]; i++; continue }
      if (row[i] === '|') { cells.push(cur); cur = '' } else cur += row[i]
    }
    cells.push(cur)
    var lead = row.trim()[0] === '|' ? 1 : 0
    if (cells[col + lead] == null) return row
    cells[col + lead] = ' ' + text + ' '
    return cells.join('|')
  }
  function textCmd(cmd) {
    var d = fdoc()
    if (cmd === 'commit') return commitEdit()
    if (cmd === 'cancel') return cancelEdit()
    if (!editing) return
    if (cmd === 'bold' || cmd === 'italic') wrapToggle(d, cmd === 'bold' ? 'STRONG' : 'EM')
    else if (cmd === 'link') { var u = prompt('リンク先の URL'); if (u) d.execCommand('createLink', false, u) }
    else if (cmd === 'code') {
      var sel = d.getSelection(); if (!sel.rangeCount || sel.isCollapsed) return
      var range = sel.getRangeAt(0), code = d.createElement('code'); code.textContent = range.toString(); range.deleteContents(); range.insertNode(code)
    }
    if (editing) editing.focus()
  }

  /** 選んだ文字を <strong> / <em> で包む（すでに包まれていれば外す）。見出しのように元から太い要素でも効くよう、自前で行う */
  function wrapToggle(d, tag) {
    var sel = d.getSelection(); if (!sel.rangeCount || sel.isCollapsed) return
    var range = sel.getRangeAt(0)
    var anc = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode
    var wrap = anc.closest && anc.closest(tag === 'STRONG' ? 'strong, b' : 'em, i')
    if (wrap && editing && editing.contains(wrap) && wrap !== editing) {
      var parent = wrap.parentNode
      while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap)
      parent.removeChild(wrap)
      return
    }
    var w = d.createElement(tag.toLowerCase())
    w.appendChild(range.extractContents()); range.insertNode(w)
    sel.removeAllRanges(); var nr = d.createRange(); nr.selectNodeContents(w); sel.addRange(nr)
  }

  // ================================================================ .md の編集とスクロール連動
  function setRaw(text, fromPreview) {
    state.raw = text; state.dirtyMd = true; markDirty()
    if (fromPreview) { var ta = $('#mdText'), top = ta.scrollTop; ta.value = text; ta.scrollTop = top; renderPreview().then(buildMirror) }
  }
  var mirror = null, lineTops = []
  function buildMirror() {
    var ta = $('#mdText'); if (!ta.offsetParent) return
    if (!mirror) { mirror = el('div', { 'aria-hidden': 'true' }); document.body.appendChild(mirror) }
    var cs = getComputedStyle(ta)
    mirror.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre-wrap;overflow-wrap:anywhere;'
      + 'width:' + ta.clientWidth + 'px;padding:' + cs.padding + ';font:' + cs.font + ';tab-size:' + cs.tabSize + ';box-sizing:border-box'
    mirror.innerHTML = ''
    var frag = document.createDocumentFragment()
    ta.value.split('\n').forEach(function (l) { var d = document.createElement('div'); d.textContent = l || '​'; frag.appendChild(d) })
    mirror.appendChild(frag)
    lineTops = Array.prototype.map.call(mirror.children, function (c) { return c.offsetTop })
  }
  var rebuildMirrorSoon = debounce(buildMirror, 300)
  function mdLineAtTop() {
    var y = $('#mdText').scrollTop + 8, lo = 0, hi = lineTops.length - 1
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (lineTops[mid] <= y) lo = mid; else hi = mid - 1 }
    return lo
  }
  function previewBlocks() {
    var d = fdoc(); if (!d) return []
    return Array.prototype.filter.call(d.querySelectorAll('[data-src]'), function (e) { return e.getClientRects().length })
      .map(function (e) { return { line: Number(e.getAttribute('data-src').split(':')[0]), top: absTop(e) } })
      .sort(function (a, b) { return a.top - b.top })
  }
  var syncFrom = null, syncTimer
  function lock(src) { syncFrom = src; clearTimeout(syncTimer); syncTimer = setTimeout(function () { syncFrom = null }, 200) }
  function syncPreviewFromMd() {
    if (state.view !== 'split' || syncFrom === 'preview') return
    var line = mdLineAtTop(), blocks = previewBlocks(); if (!blocks.length) return
    var b = blocks.find(function (x) { return x.line >= line }) || blocks[blocks.length - 1]
    lock('md'); $('#stage').scrollTop = Math.max(0, b.top * scale() - 16)
  }
  function syncMdFromPreview() {
    if (state.view !== 'split' || syncFrom === 'md') return
    var y = $('#stage').scrollTop / scale() + 16, blocks = previewBlocks(); if (!blocks.length) return
    var b = blocks[0]
    for (var i = 0; i < blocks.length; i++) { if (blocks[i].top <= y) b = blocks[i]; else break }
    lock('preview'); $('#mdText').scrollTop = Math.max(0, (lineTops[b.line] || 0) - 8)
  }

  // ================================================================ 🎨 スタイル（GUI の区画）
  function splitGui(css) {
    var a = css.indexOf(GUI_BEGIN), b = css.indexOf(GUI_END)
    if (a < 0 || b < a) return { before: css.replace(/\s*$/, '\n\n'), gui: '', after: '\n' }
    var headEnd = css.indexOf('*/', a) + 2
    return { before: css.slice(0, headEnd) + '\n', gui: css.slice(headEnd, b), after: css.slice(b) }
  }
  function parseGui(text) {
    var edits = [], src = text.replace(/\/\*[\s\S]*?\*\//g, '')
    var re = /(@media[^{]+)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}|([^{}@]+)\{([^{}]*)\}/g, m
    function add(media, sel, body) {
      var props = {}
      body.split(';').forEach(function (d) { var i = d.indexOf(':'); if (i > 0) { var k = d.slice(0, i).trim(), v = d.slice(i + 1).trim(); if (k && v) props[k] = v } })
      if (Object.keys(props).length) edits.push({ media: media, selector: sel.trim(), props: props })
    }
    while ((m = re.exec(src))) {
      if (m[1]) { var media = /max-width/.test(m[1]) ? 'mobile' : /min-width/.test(m[1]) ? 'desktop' : 'all', r2 = /([^{}]+)\{([^{}]*)\}/g, n; while ((n = r2.exec(m[2]))) add(media, n[1], n[2]) }
      else add('all', m[3], m[4])
    }
    return edits
  }
  function guiCss() {
    var out = []
    ;['all', 'mobile', 'desktop'].forEach(function (media) {
      var rules = state.edits.filter(function (e) { return e.media === media && Object.keys(e.props).length })
      if (!rules.length) return
      var body = rules.map(function (e) { return e.selector + ' {\n' + Object.keys(e.props).map(function (k) { return '  ' + k + ': ' + e.props[k] + ';' }).join('\n') + '\n}' }).join('\n')
      out.push(MEDIA[media] ? MEDIA[media] + ' {\n' + body.replace(/^/gm, '  ') + '\n}' : body)
    })
    return out.join('\n\n')
  }
  function fullCss() {
    var parts = splitGui(state.articleCss), gui = guiCss()
    if (state.articleCss.indexOf(GUI_BEGIN) < 0) return parts.before + '/* @gui-begin（GUI エディタが管理する区画。保存のたびに書き直される） */\n' + (gui ? gui + '\n' : '') + GUI_END + '\n'
    return parts.before + (gui ? gui + '\n' : '') + parts.after
  }
  function applyCss() {
    var d = fdoc(); if (!d) return
    var parts = splitGui(state.articleCss), base = d.getElementById('__overrides'), gui = d.getElementById('__gui')
    if (base) base.textContent = window.scopeCss(parts.before + parts.after, ROOT)
    if (gui) gui.textContent = window.scopeCss(guiCss(), ROOT)
    $('#guiCss').textContent = guiCss() || '（まだ変更はありません）'
    scheduleFit()
  }

  var STATE_CLASSES = /^(reveal|reveal--list|is-inview|is-open|is-collapsible|is-animating|has-copy|md-marker|is-drawn|md-spot|md-tilt|is-shown|is-visible|is-above|js-motion|md-ready|md-render|noe-tight)$/
  function isUtility(c) {
    if (/[:\[\]\/!.%()#]/.test(c) || /-module__/.test(c) || STATE_CLASSES.test(c)) return true
    return /^-?(m|p|mx|my|mt|mb|ml|mr|px|py|pt|pb|pl|pr|w|h|min|max|size|text|bg|flex|grid|gap|space|items|justify|self|content|font|leading|tracking|rounded|border|shadow|opacity|z|top|left|right|bottom|inset|absolute|relative|fixed|sticky|block|inline|hidden|overflow|transition|duration|ease|delay|animate|transform|scale|rotate|translate|origin|cursor|select|pointer|aspect|object|col|row|order|shrink|grow|basis|whitespace|break|truncate|list|underline|uppercase|lowercase|capitalize|normal|italic|not|group|peer|sr|drop|blur|backdrop|from|via|to|stroke|fill|ring|outline|divide|place|float|clear|isolate|mix|lg|md|sm|xl|2xl|antialiased|container|prose|native|line|decoration|indent|align|will|touch|resize|snap|scroll|appearance|accent|caret|table|caption|contents|visible|invisible|static|isolation|box|filter|invert|sepia|saturate|brightness|contrast|hue|grayscale)(-|$)/.test(c)
  }
  function compClasses(e) { return Array.prototype.filter.call(e.classList || [], function (c) { return !isUtility(c) && !/^article-/.test(c) }) }
  function ownArticleClass(e) { return Array.prototype.find.call(e.classList || [], function (x) { return /^article-/.test(x) && ['article-page', 'article-mobile', 'article-desktop'].indexOf(x) < 0 }) }
  function semOf(e) { for (var cur = e.parentElement; cur && cur.tagName !== 'BODY'; cur = cur.parentElement) { var c = ownArticleClass(cur); if (c) return '.' + c } return '' }
  function count(sel) { try { return fdoc().querySelectorAll(sel).length } catch (e) { return -1 } }
  function candidates(target) {
    var tag = target.tagName.toLowerCase(), own = ownArticleClass(target), sem = semOf(target), comps = compClasses(target)
    var pre = sem ? sem + ' ' : '', list = []
    if (own) list.push({ sel: '.' + own, label: 'この部品（' + own + '）' })
    else list.push({ sel: pre + tag, label: (sem ? sem.slice(1) + ' の中の ' : '') + '<' + tag + '> ぜんぶ' })
    comps.forEach(function (c) { list.push({ sel: pre + '.' + c, label: '「' + c + '」の付いた要素ぜんぶ' }) })
    comps.forEach(function (c) { list.push({ sel: pre + tag + '.' + c, label: '<' + tag + '> のうち「' + c + '」のものだけ' }) })
    var parent = target.parentElement, pc = parent && compClasses(parent)[0]
    if (pc) list.push({ sel: pre + '.' + pc + ' ' + tag, label: '「' + pc + '」の中の <' + tag + '> だけ' })
    if (sem) list.push({ sel: tag, label: 'ページ中の <' + tag + '> ぜんぶ' })
    var seen = {}
    return list.filter(function (c) { if (seen[c.sel]) return false; seen[c.sel] = 1; c.count = count(c.sel); return c.count > 0 })
  }
  function clearMarks() { var d = fdoc(); if (d) d.querySelectorAll('[data-noe-sel],[data-noe-match]').forEach(function (e) { e.removeAttribute('data-noe-sel'); e.removeAttribute('data-noe-match') }) }
  function markSelector(sel) {
    clearMarks()
    try { fdoc().querySelectorAll(sel).forEach(function (e) { e.setAttribute('data-noe-match', '') }) } catch (e) {}
    if (state.el && state.el.isConnected) state.el.setAttribute('data-noe-sel', '')
  }
  function pick(target) {
    state.el = target
    setPanelCollapsed(false)
    var list = candidates(target), s = $('#selector')
    s.innerHTML = ''; s.disabled = false
    list.forEach(function (c) { s.appendChild(el('option', { value: c.sel, text: c.label + '　' + c.sel + '（' + c.count + '）' })) })
    s.appendChild(el('option', { value: '__custom', text: '✏︎ セレクタを自分で書く…' }))
    $('#selectorCustom').hidden = true
    $('#picked').innerHTML = '選んだ要素：<b>&lt;' + esc(target.tagName.toLowerCase()) + '&gt;</b>　' + esc((target.textContent || '').trim().slice(0, 24))
    chooseSelector(list[0] ? list[0].sel : target.tagName.toLowerCase())
  }
  function chooseSelector(sel) {
    if (!sel) return
    state.selector = sel
    if ($('#selector').value !== sel) {
      if (![].some.call($('#selector').options, function (o) { return o.value === sel })) $('#selector').insertBefore(el('option', { value: sel, text: sel }), $('#selector').lastChild)
      $('#selector').value = sel; $('#selector').disabled = false
    }
    if (!state.el || !state.el.isConnected) { try { state.el = fdoc().querySelector(sel) } catch (e) {} }
    markSelector(sel); renderGroups(); renderMore()
  }

  function editFor(sel, media) { return state.edits.find(function (e) { return e.selector === sel && e.media === media }) }
  function edited(prop) { var e = editFor(state.selector, state.media); return e && e.props[prop] != null ? e.props[prop] : null }
  function computed(prop) { return state.el && state.el.isConnected ? getComputedStyle(state.el).getPropertyValue(prop).trim() : '' }
  function valueOf(prop) { var v = edited(prop); return v != null ? v : computed(prop) }
  var lastHistoryAt = 0
  function pushHistory() {
    var now = Date.now(); if (now - lastHistoryAt < 700) return
    lastHistoryAt = now; state.history.push(JSON.stringify(state.edits)); if (state.history.length > 100) state.history.shift()
    $('#undo').disabled = false
  }
  function setValue(prop, value) {
    if (!state.selector) return
    pushHistory()
    var e = editFor(state.selector, state.media)
    if (!e) { e = { media: state.media, selector: state.selector, props: {} }; state.edits.push(e) }
    if (value == null || value === '') delete e.props[prop]; else e.props[prop] = value
    state.edits = state.edits.filter(function (x) { return Object.keys(x.props).length })
    state.dirtyCss = true; markDirty(); applyCss(); renderEdits()
  }
  function undo() {
    var prev = state.history.pop(); if (prev == null) return
    state.edits = JSON.parse(prev); applyCss(); renderEdits(); renderGroups(); renderMore()
    $('#undo').disabled = !state.history.length; state.dirtyCss = true; markDirty()
  }

  var FONT_WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900']
  var GROUPS = [
    { name: '文字', open: true, rows: [
      ['font-size', 'length', { px: [6, 120, 1] }, 'サイズ'], ['font-weight', 'select', FONT_WEIGHTS, '太さ'],
      ['line-height', 'number', [0.8, 3, 0.05], '行の高さ'], ['letter-spacing', 'length', { px: [-5, 20, 0.1] }, '字間'],
      ['color', 'color', null, '色'], ['text-align', 'seg', ['left', 'center', 'right', 'justify'], '揃え'],
      ['font-style', 'toggle', ['normal', 'italic'], '斜体'], ['text-decoration-line', 'toggle', ['none', 'underline'], '下線'],
      ['text-transform', 'seg', ['none', 'uppercase', 'lowercase'], '大文字'],
      ['font-family', 'select', ['var(--font-sans)', 'var(--font-mono)', 'serif', 'sans-serif', 'monospace'], '書体'],
    ] },
    { name: '余白', rows: [
      ['margin-top', 'length', { px: [-100, 200, 1] }, '外・上'], ['margin-bottom', 'length', { px: [-100, 200, 1] }, '外・下'],
      ['margin-left', 'length', { px: [-100, 200, 1] }, '外・左'], ['margin-right', 'length', { px: [-100, 200, 1] }, '外・右'],
      ['padding-top', 'length', { px: [0, 160, 1] }, '内・上'], ['padding-bottom', 'length', { px: [0, 160, 1] }, '内・下'],
      ['padding-left', 'length', { px: [0, 160, 1] }, '内・左'], ['padding-right', 'length', { px: [0, 160, 1] }, '内・右'],
    ] },
    { name: 'サイズ', rows: [['width', 'length', { px: [0, 1600, 1] }, '幅'], ['max-width', 'length', { px: [0, 1600, 1] }, '最大幅'], ['height', 'length', { px: [0, 1200, 1] }, '高さ']] },
    { name: '背景・枠', rows: [
      ['background-color', 'color', null, '背景色'], ['border-radius', 'length', { px: [0, 80, 1] }, '角丸'],
      ['border-width', 'length', { px: [0, 12, 1] }, '枠の太さ'], ['border-style', 'seg', ['none', 'solid', 'dashed', 'dotted'], '枠の線'], ['border-color', 'color', null, '枠の色'],
    ] },
    { name: '効果', rows: [['opacity', 'number', [0, 1, 0.01], '不透明度'], ['text-shadow', 'shadow', null, '文字の影'], ['box-shadow', 'shadow', null, '箱の影']] },
    { name: '配置', rows: [
      ['display', 'select', ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'], '表示'],
      ['vertical-align', 'select', ['baseline', 'top', 'middle', 'bottom'], '縦位置'], ['white-space', 'select', ['normal', 'nowrap', 'pre', 'pre-wrap'], '折り返し'],
    ] },
  ]
  function toRgba(value) {
    var c = document.createElement('canvas'); c.width = c.height = 1
    var ctx = c.getContext('2d'); ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillStyle = value || 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 1, 1)
    var d = ctx.getImageData(0, 0, 1, 1).data
    return { r: d[0], g: d[1], b: d[2], a: Math.round(d[3] / 255 * 100) / 100 }
  }
  function hex(c) { return '#' + [c.r, c.g, c.b].map(function (n) { return n.toString(16).padStart(2, '0') }).join('') }
  function rgbaStr(c) { return c.a >= 1 ? hex(c) : 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + c.a + ')' }
  var UNITS = { px: 1, rem: 1 / 16, em: 1 / 16, '%': 1 / 8, vw: 1 / 12 }

  function propRow(prop, type, opt, label) {
    var on = edited(prop) != null, val = valueOf(prop)
    var row = el('div', { class: 'prow' + (on ? ' on' : '') })
    var chk = el('input', { type: 'checkbox', title: 'チェック＝この値で上書きする' }); chk.checked = on
    var name = el('div', { class: 'pname', html: esc(label || prop) + (label ? '<small class="mono">' + esc(prop) + '</small>' : '') })
    var ctl = el('div', { class: 'pctl' }), raw = el('input', { type: 'text', class: 'pval mono', value: val })
    var reset = el('button', { class: 'preset', title: '元に戻す', text: '↺' })
    var set = function (v) { raw.value = v; chk.checked = true; row.classList.add('on'); setValue(prop, v) }
    chk.addEventListener('change', function () { if (chk.checked) { row.classList.add('on'); setValue(prop, raw.value.trim()) } else { row.classList.remove('on'); setValue(prop, null); raw.value = computed(prop) } })
    raw.addEventListener('change', function () { set(raw.value.trim()) })
    reset.addEventListener('click', function () { setValue(prop, null); renderGroups(); renderMore() })
    if (type === 'length') {
      var m = String(val).match(/^(-?[\d.]+)(px|rem|em|%|vw|vh)?$/), unit = m && m[2] ? m[2] : 'px', num = m ? parseFloat(m[1]) : 0, base = (opt && opt.px) || [0, 200, 1]
      var unitSel = el('select', { class: 'unit' }); Object.keys(UNITS).forEach(function (u) { var o = el('option', { value: u, text: u }); if (u === unit) o.selected = true; unitSel.appendChild(o) })
      var mk = function () { var f = UNITS[unitSel.value]; return el('input', { type: 'range', min: base[0] * f, max: base[1] * f, step: unitSel.value === 'px' ? base[2] : 0.01, value: num }) }
      var r = mk(), wire = function (rr) { rr.addEventListener('input', function () { num = parseFloat(rr.value); set(rr.value + unitSel.value) }) }
      wire(r); unitSel.addEventListener('change', function () { var nr = mk(); r.replaceWith(nr); r = nr; wire(nr) })
      ctl.appendChild(r); ctl.appendChild(unitSel)
    } else if (type === 'number') {
      var n = parseFloat(val); if (isNaN(n)) n = opt[0]
      if (prop === 'line-height' && /px$/.test(val)) { var fs = parseFloat(computed('font-size')); if (fs) { n = Math.round(parseFloat(val) / fs * 100) / 100; raw.value = String(n) } }
      var rn = el('input', { type: 'range', min: opt[0], max: opt[1], step: opt[2], value: n }); rn.addEventListener('input', function () { set(rn.value) }); ctl.appendChild(rn)
    } else if (type === 'color') {
      var c = toRgba(val), pk = el('input', { type: 'color', value: hex(c) }), al = el('input', { type: 'range', min: 0, max: 1, step: 0.01, value: c.a, title: '透明度' })
      var emit = function () { var nc = toRgba(pk.value); nc.a = parseFloat(al.value); set(rgbaStr(nc)) }
      pk.addEventListener('input', emit); al.addEventListener('input', emit); ctl.appendChild(pk); ctl.appendChild(al)
    } else if (type === 'select') {
      var sel = el('select'), opts = opt.slice(); if (val && opts.indexOf(val) < 0) opts.unshift(val)
      opts.forEach(function (o) { var op = el('option', { value: o, text: o }); if (o === val) op.selected = true; sel.appendChild(op) })
      sel.addEventListener('change', function () { set(sel.value) }); ctl.appendChild(sel)
    } else if (type === 'seg') {
      var box = el('div', { class: 'segb' })
      opt.forEach(function (o) { var b = el('button', { text: o, class: o === val ? 'on' : '' }); b.addEventListener('click', function () { box.querySelectorAll('button').forEach(function (x) { x.className = '' }); b.className = 'on'; set(o) }); box.appendChild(b) })
      ctl.appendChild(box)
    } else if (type === 'toggle') {
      var tg = el('input', { type: 'checkbox' }); tg.checked = val === opt[1] || (prop === 'text-decoration-line' && /underline/.test(val))
      tg.addEventListener('change', function () { set(tg.checked ? opt[1] : opt[0]) }); ctl.appendChild(tg); ctl.appendChild(el('span', { class: 'hint', text: opt[1] }))
    } else if (type === 'shadow') return shadowRows(prop, row, chk, name, raw, reset, set, val)
    row.appendChild(chk); row.appendChild(name); row.appendChild(ctl); row.appendChild(raw); row.appendChild(reset)
    return row
  }
  function parseShadow(v) {
    var s = { x: 0, y: 2, blur: 8, spread: 0, color: 'rgba(0, 0, 0, 0.5)', inset: false, none: !v || v === 'none' }
    if (s.none) return s
    var first = v.split(/,(?![^(]*\))/)[0].trim(), col = first.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}|oklch\([^)]*\)|lab\([^)]*\))/i)
    if (col) { s.color = col[1]; first = first.replace(col[1], '') }
    s.inset = /\binset\b/.test(first)
    var nums = (first.replace('inset', '').match(/-?[\d.]+(px)?/g) || []).map(parseFloat)
    s.x = nums[0] || 0; s.y = nums[1] || 0; s.blur = nums[2] || 0; s.spread = nums[3] || 0
    return s
  }
  function shadowRows(prop, row, chk, name, raw, reset, set, val) {
    var wrap = el('div'), s = parseShadow(val), isBox = prop === 'box-shadow', c = toRgba(s.color)
    var ctl = el('div', { class: 'pctl' }, [el('span', { class: 'hint', text: s.none ? '今は影なし（✓ で付ける）' : '' })])
    row.appendChild(chk); row.appendChild(name); row.appendChild(ctl); row.appendChild(raw); row.appendChild(reset); wrap.appendChild(row)
    var inputs = {}
    var emit = function () {
      var col = toRgba(inputs.color.value); col.a = parseFloat(inputs.alpha.value)
      var parts = [(isBox && inputs.inset.checked ? 'inset ' : '') + inputs.x.value + 'px', inputs.y.value + 'px', inputs.blur.value + 'px']
      if (isBox) parts.push(inputs.spread.value + 'px')
      ctl.firstChild.textContent = ''; set(parts.join(' ') + ' ' + rgbaStr(col))
    }
    var sub = function (lab, input, out) { wrap.appendChild(el('div', { class: 'prow sub' }, [el('span'), el('div', { class: 'pname', text: lab }), el('div', { class: 'pctl' }, [input]), out || el('span'), el('span')])) }
    ;[['x', '横 X', -60, 60, s.x], ['y', '縦 Y', -60, 60, s.y], ['blur', 'ぼかし', 0, 120, s.blur]].concat(isBox ? [['spread', '広がり', -60, 60, s.spread]] : []).forEach(function (d) {
      var r = el('input', { type: 'range', min: d[2], max: d[3], step: 1, value: d[4] }), o = el('span', { class: 'mono hint', text: d[4] + 'px' })
      r.addEventListener('input', function () { o.textContent = r.value + 'px'; emit() }); inputs[d[0]] = r; sub(d[1], r, o)
    })
    inputs.color = el('input', { type: 'color', value: hex(c) }); inputs.alpha = el('input', { type: 'range', min: 0, max: 1, step: 0.01, value: c.a })
    inputs.color.addEventListener('input', emit); inputs.alpha.addEventListener('input', emit); sub('色', inputs.color); sub('透明度', inputs.alpha)
    if (isBox) { inputs.inset = el('input', { type: 'checkbox' }); inputs.inset.checked = s.inset; inputs.inset.addEventListener('change', emit); sub('内側', inputs.inset) }
    chk.addEventListener('change', function () { if (chk.checked && (!raw.value || raw.value === 'none')) emit() })
    return wrap
  }
  var openState = {}
  function renderGroups() {
    var box = $('#groups'); box.innerHTML = ''
    if (!state.selector) { box.appendChild(el('p', { class: 'hint', style: 'margin:12px', text: '要素を選ぶと、ここに「文字」「余白」「サイズ」などの設定が出ます。' })); return }
    GROUPS.forEach(function (g) {
      var d = el('details', { class: 'group' }); d.open = openState[g.name] != null ? openState[g.name] : !!g.open
      var nEdited = g.rows.filter(function (r) { return edited(r[0]) != null }).length
      d.appendChild(el('summary', { html: esc(g.name) + (nEdited ? ' <span class="hint">（' + nEdited + '）</span>' : '') }))
      var fill = function () { if (!d.querySelector('.prow')) g.rows.forEach(function (r) { d.appendChild(propRow(r[0], r[1], r[2], r[3])) }) }
      if (d.open) fill()
      d.addEventListener('toggle', function () { openState[g.name] = d.open; if (d.open) fill() })
      box.appendChild(d)
    })
  }
  var allProps = null
  function propNames() {
    if (allProps) return allProps
    var cs = getComputedStyle(document.body), names = {}
    for (var i = 0; i < cs.length; i++) if (cs[i][0] !== '-' || /^-webkit-(text-stroke|line-clamp|background-clip|text-fill)/.test(cs[i])) names[cs[i]] = 1
    ;['margin', 'padding', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right', 'background', 'font', 'transition', 'inset', 'gap', 'outline', 'text-decoration', 'list-style', 'flex', 'grid-template-columns', 'animation', 'columns'].forEach(function (n) { names[n] = 1 })
    return (allProps = Object.keys(names).sort())
  }
  function typeFor(prop, val) {
    if (prop === 'text-shadow' || prop === 'box-shadow') return ['shadow', null]
    if (/color$/.test(prop) || ['fill', 'stroke'].indexOf(prop) >= 0) return ['color', null]
    if (/^-?[\d.]+(px|rem|em|%|vw|vh)$/.test(val)) return ['length', { px: /size/.test(prop) ? [6, 120, 1] : /spacing/.test(prop) ? [-5, 20, 0.1] : [-100, 400, 1] }]
    if (/^-?[\d.]+$/.test(val)) return ['number', /opacity/.test(prop) ? [0, 1, 0.01] : [0, 10, 0.1]]
    return ['select', [val]]
  }
  function renderMore() {
    var box = $('#moreRows'); box.innerHTML = ''
    if (!state.selector) return
    var q = $('#propSearch').value.trim().toLowerCase(), inGroups = {}
    GROUPS.forEach(function (g) { g.rows.forEach(function (r) { inGroups[r[0]] = 1 }) })
    var e = editFor(state.selector, state.media)
    var names = q ? propNames().filter(function (n) { return n.indexOf(q) >= 0 }) : Object.keys((e && e.props) || {}).filter(function (n) { return !inGroups[n] })
    names.slice(0, 40).forEach(function (n) { var t = typeFor(n, valueOf(n)); box.appendChild(propRow(n, t[0], t[1], null)) })
    if (q && !names.length) box.appendChild(el('p', { class: 'hint', text: '見つかりません' }))
    if (names.length > 40) box.appendChild(el('p', { class: 'hint', text: '…ほか ' + (names.length - 40) + ' 件。もう少し絞り込んでください' }))
  }
  function renderEdits() {
    var box = $('#edits'); box.innerHTML = ''
    var n = 0
    state.edits.forEach(function (e) {
      var g = el('div', { class: 'grp', html: '<div class="sel mono">' + esc(e.selector) + '</div>' + (e.media !== 'all' ? '<div class="media">' + (e.media === 'mobile' ? 'モバイルだけ' : 'PC だけ') + '</div>' : '') })
      Object.keys(e.props).forEach(function (k) {
        n++
        var d = el('div', { class: 'decl mono', html: '<span>' + esc(k) + ': ' + esc(e.props[k]) + '</span><button title="この変更を消す">×</button>' })
        d.querySelector('span').addEventListener('click', function () { state.media = e.media; document.querySelector('input[name=media][value=' + e.media + ']').checked = true; state.el = null; chooseSelector(e.selector) })
        d.querySelector('button').addEventListener('click', function () {
          pushHistory(); delete e.props[k]; state.edits = state.edits.filter(function (x) { return Object.keys(x.props).length })
          state.dirtyCss = true; markDirty(); applyCss(); renderEdits(); renderGroups(); renderMore()
        })
        g.appendChild(d)
      })
      box.appendChild(g)
    })
    $('#editCount').textContent = n ? '（' + n + ' 件）' : ''
  }

  // ================================================================ 保存
  function markDirty() { $('#save').textContent = state.dirtyMd || state.dirtyCss ? '保存 ●' : '保存' }
  window.addEventListener('beforeunload', function (e) { if (state.dirtyMd || state.dirtyCss) { e.preventDefault(); e.returnValue = '' } })
  // ---------------------------------------------------------------- 保存の結果（理由つき）
  var reportRows = []
  function showReport(rows) {
    reportRows = rows
    var ol = $('#reportList'); ol.innerHTML = ''
    rows.forEach(function (r) {
      ol.appendChild(el('li', { class: r.kind || '', html: '<span>' + r.icon + '</span><b>' + esc(r.title) + '</b>' +
        (r.detail || r.link ? '<span class="d">' + esc(r.detail || '') + (r.link ? ' <a href="' + esc(r.link.href) + '" target="_blank" rel="noopener">' + esc(r.link.text) + '</a>' : '') + '</span>' : '') }))
    })
    $('#report').hidden = !rows.length
  }
  function setRow(i, row) { reportRows[i] = row; showReport(reportRows) }
  /** 保存に失敗した理由を、何をすればいいか分かる言葉にする */
  function saveError(e) {
    var s = e && e.status
    if (s === 401) return 'GitHub の鍵が無効か、期限切れです（⚙︎ から鍵を入れ直してください）'
    if (s === 403) return 'この鍵には書き込みの権限がありません（noe-posts の「Contents：Read and write」が必要）'
    if (s === 409) return '別の場所で同じファイルが先に更新されています（↻ で読み直してから、もう一度直してください）'
    if (s === 422) return 'GitHub が受け付けませんでした（' + e.message + '）'
    if (e instanceof TypeError) return 'ネットに繋がっていないか、GitHub に届きませんでした'
    return e && e.message ? e.message : '不明なエラー'
  }
  function askSaveAnyway(missing) {
    return new Promise(function (resolve) {
      var d = $('#saveDlg'), ul = $('#saveDlgList'); ul.innerHTML = ''
      missing.forEach(function (m) { ul.appendChild(el('li', { text: m })) })
      d.onclose = function () { resolve(d.returnValue === 'save') }
      d.returnValue = ''; d.showModal()
    })
  }
  function previewUrl() {
    var parts = state.path.split('/'), slug = (state.front && state.front.slug) || parts[parts.length - 2] || ''
    return (store.kind === 'payload' ? '' : 'https://noe-shiftica.com') + '/' + (parts[0] === 'dev' ? 'dev' : 'blog') + '/' + encodeURIComponent(String(slug).replace(/^["']|["']$/g, '')) + '/preview'
  }

  async function save() {
    if (editing) commitEdit()
    if (!state.dirtyMd && !state.dirtyCss) { status('変更はありません'); showReport([{ icon: 'ℹ️', title: '変更はありません', detail: '保存するものがありませんでした' }]); return }
    $('#save').disabled = true
    var rows = [], missing = [], pending = {}
    var path = state.path, raw = state.raw, original = state.originalMd, crlf = state.crlf
    var dir = path ? path.split('/').slice(0, -1).join('/') : ''
    var hero = splitFront(raw).front.hero
    var usedImages = new Set(store.referencedImages(raw).concat(hero ? [hero.replace(/^\.\//, '')] : []))
    Object.keys(state.pendingImages).forEach(function (file) {
      if (usedImages.has(file.slice(dir.length + 1))) pending[file] = state.pendingImages[file]
    })
    try {
      // 1. 保存の前に、本文が使っている画像がフォルダにそろっているか確かめる
      if (state.dirtyMd && store.missingImages) {
        status('画像を確認中…')
        try { missing = await store.missingImages(path, raw, pending) } catch (e) { missing = [] }
        if (missing.length && !(await askSaveAnyway(missing))) {
          status('保存をやめました')
          showReport([{ icon: '⏸', title: '保存していません', detail: '画像が足りないため、保存をやめました：' + missing.join('、') }])
          return
        }
      }
      // 2. 記事
      if (state.dirtyMd && state.path === path && state.raw === raw) {
        status('記事を保存中…')
        var text = crlf ? raw.replace(/\n/g, '\r\n') : raw
        try {
          var r1 = await store.write(path, text, pending, original)
          if (state.path === path && state.originalMd === original) {
            state.originalMd = raw
            if (state.raw === raw) {
              state.pendingImages = {}
              state.dirtyMd = false
            } else {
              Object.keys(pending).forEach(function (file) { delete state.pendingImages[file] })
            }
            if (Object.keys(pending).length) {
              await fillBranches(path).catch(function () {})
              updateGhLink()
            }
          }
          rows.push({ icon: '✅', kind: 'ok', title: '記事を保存しました', detail: r1.where + ' に保存（' + (r1.sha ? 'commit ' + r1.sha.slice(0, 7) : '手元のファイル') + '）' })
          if (r1.sha && store.watchSend) {
            var idx = rows.length
            rows.push(missing.length
              ? { icon: '⏳', title: 'サイトへの下書き送信', detail: '画像が足りないので失敗するはずです（' + missing.join('、') + '）。結果を確認中…' }
              : { icon: '⏳', title: 'サイトへの下書き送信', detail: 'GitHub の Action が動くのを待っています…' })
            watchSendResult(r1.sha, idx, missing)
          } else if (!r1.sha) {
            rows.push({ icon: 'ℹ️', title: 'サイトにはまだ送っていません', detail: '手元に保存しました。Working Copy で下書きブランチに push すると、サイトに送られます' })
          }
        } catch (e) {
          rows.push({ icon: '❌', kind: 'err', title: '記事を保存できませんでした', detail: saveError(e) })
        }
      }
      // 3. 見た目
      if (state.dirtyCss) {
        status('見た目を保存中…')
        try {
          var css = fullCss(), r2 = await store.write('_assets/md/article.css', css); state.articleCss = css; state.dirtyCss = false
          rows.push({ icon: '✅', kind: 'ok', title: '見た目を保存しました', detail: r2.where + ' に保存。サイトへは、自動で作られるプルリクエストのマージ後に反映されます' })
        } catch (e) {
          rows.push({ icon: '❌', kind: 'err', title: '見た目を保存できませんでした', detail: saveError(e) })
        }
      }
      var failed = rows.some(function (r) { return r.kind === 'err' })
      status(failed ? '保存できなかったものがあります（右下を見てください）' : '保存しました', failed ? 'err' : 'ok')
      showReport(rows)
      updateGhLink() // 初めての保存で下書きブランチができたら、リンクもそちらへ
    } finally { $('#save').disabled = false; markDirty() }
  }

  function watchSendResult(sha, idx, missing) {
    var title = 'サイトへの下書き送信'
    store.watchSend(sha, function (u) {
      if (u.state === 'waiting') setRow(idx, { icon: '⏳', title: title, detail: 'GitHub の Action が動くのを待っています…' })
      else if (u.state === 'running') setRow(idx, { icon: '⏳', title: title, detail: '送信中…', link: u.url && { href: u.url, text: '進み具合' } })
      else if (u.state === 'success') setRow(idx, { icon: '✅', kind: 'ok', title: 'サイトに届きました', detail: '下書きプレビュー（要ログイン）：', link: { href: previewUrl(), text: '開く' } })
      else if (u.state === 'failure') setRow(idx, { icon: '❌', kind: 'err', title: 'サイトに届いていません',
        detail: (u.reason || (missing.length ? '画像が足りません：' + missing.join('、') : '理由はログで確認してください')) + (u.url ? '（GitHub には保存済み）' : ''),
        link: u.url && { href: u.url, text: 'ログ' } })
      else if (u.state === 'noperm') setRow(idx, { icon: 'ℹ️', title: title + 'の結果は確認できません',
        detail: 'GitHub の鍵に「Actions：Read-only」の権限を足すと、ここに結果（理由つき）が出ます' + (missing.length ? '。なお画像が足りないので、送信は失敗しているはずです' : '') })
      else if (u.state === 'none') setRow(idx, { icon: 'ℹ️', title: '送信の Action は動きませんでした', detail: '記事ファイル以外の変更だけだったか、GitHub 側が遅れています' })
      if (u.state === 'failure') status('サイトへの下書き送信が失敗しました（右下を見てください）', 'err')
      else if (u.state === 'success') status('サイトに届きました', 'ok')
    })
  }

  // ================================================================ 表示・モードの切り替え
  /** いま見えている位置を「.md の何行目か」で返す（切り替えても同じ場所を開くため） */
  function currentLine() {
    if (state.view === 'md') return mdLineAtTop()
    var y = $('#stage').scrollTop / scale() + 16, blocks = previewBlocks(); if (!blocks.length) return 0
    var b = blocks[0]
    for (var i = 0; i < blocks.length; i++) { if (blocks[i].top <= y) b = blocks[i]; else break }
    return b.line
  }
  function scrollToLine(line) {
    if (state.view !== 'preview') { lock('preview'); $('#mdText').scrollTop = Math.max(0, (lineTops[line] || 0) - 8) }
    if (state.view !== 'md') {
      var blocks = previewBlocks(); if (!blocks.length) return
      var b = blocks.find(function (x) { return x.line >= line }) || blocks[blocks.length - 1]
      lock('md'); $('#stage').scrollTop = Math.max(0, b.top * scale() - 16)
    }
  }
  function setPanelCollapsed(on) {
    document.body.classList.toggle('panel-collapsed', on)
    $('#panelToggle').textContent = on ? '⟨' : '⟩'
    setTimeout(function () { fitStage(false) }, 0)
  }
  function setView(v) {
    if (editing) commitEdit()
    var anchor = state.path ? currentLine() : 0
    state.view = v; remember('view', v)
    // 表示の印は1つだけにする（view-diff を外し忘れると、差分のあとプレビューに戻れず、別の記事も古い差分の下に隠れていた）
    document.body.classList.remove('view-preview', 'view-split', 'view-md', 'view-diff'); document.body.classList.add('view-' + v)
    document.querySelectorAll('#view button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v) })
    if (v !== 'preview' && state.mode === 'style') setMode('style')
    setTimeout(function () { fitStage(false); buildMirror(); if (state.path) scrollToLine(anchor) }, 0)
    if (v === 'diff') renderDiff()
  }
  function setMode(m) {
    if (m === 'style' && store.allowStyle === false) return
    if (editing) commitEdit()
    var prev = state.mode
    state.mode = state.mode === m ? null : m
    document.body.classList.toggle('mode-style', state.mode === 'style')
    document.body.classList.toggle('mode-text', state.mode === 'text')
    document.querySelectorAll('#mode button').forEach(function (b) { b.classList.toggle('on', b.dataset.m === state.mode) })
    if (state.mode === 'style' && state.view !== 'preview') setView('preview')
    if (state.mode !== 'style') clearMarks(); else if (state.selector) markSelector(state.selector)
    // 文章モードは「1 行ずつの印」を細かく付け直すので描き直す
    if ((prev === 'text') !== (state.mode === 'text') && state.path) renderPreview()
    else setTimeout(function () { fitStage(false) }, 0)
  }

  function settings() {
    $('#storeLabel').textContent = '読み書き先：' + store.label
    $('#tokenBox').hidden = store.kind !== 'github'
    $('#tokenResult').textContent = store.kind === 'github' ? (store.hasToken() ? '鍵は保存済みです' : 'まだ鍵がありません') : ''
    var pb = $('#payloadBox')
    if (pb) {
      pb.hidden = store.kind !== 'payload'
      if (store.kind === 'payload') {
        var c = (store.config && store.config()) || {}
        $('#payloadState').textContent = (c.repo ? 'リポジトリ：' + c.repo : 'リポジトリ：未設定') + ' ／ ' + (c.hasToken ? 'GitHub の鍵：設定済み（' + (c.tokenHint || '') + '）' : 'GitHub の鍵：未設定')
        $('#payloadLink').href = c.settingsUrl || '/admin/globals/markdown-post-manager-settings'
      }
    }
    $('#settingsDlg').showModal()
  }
  async function saveToken() {
    var t = $('#tokenInput').value.trim(); if (!t) return
    store.setToken(t)
    $('#tokenResult').textContent = '確認中…'
    try { $('#tokenResult').textContent = 'OK：' + (await store.check()) + ' に接続できました'; $('#tokenInput').value = ''; setTimeout(function () { $('#settingsDlg').close(); start() }, 600) }
    catch (e) { $('#tokenResult').textContent = 'つながりませんでした：' + e.message; store.setToken(null) }
  }

  // ================================================================ 記事の一覧（左から出る）
  var articles = []
  function openDrawer() { document.body.classList.add('drawer-open'); setTimeout(function () { var on = document.querySelector('#articleList button.on'); if (on) on.scrollIntoView({ block: 'center' }) }, 50) }
  function closeDrawer() { document.body.classList.remove('drawer-open') }
  function renderArticleList() {
    var box = $('#articleList'); if (!box) return
    box.innerHTML = ''
    var q = ($('#articleSearch').value || '').trim().toLowerCase()
    var drafts = store.knownDrafts ? store.knownDrafts() : []
    var GROUP = [['dev', 'Dev Journal'], ['blog', 'Blog']]
    var SUB = [['', '執筆中'], ['_fin', '公開済み（_fin）'], ['_archived', 'アーカイブ（_archived）'], ['other', 'その他']]
    GROUP.forEach(function (g) {
      var inGroup = articles.filter(function (p) { return p.indexOf(g[0] + '/') === 0 && (!q || p.toLowerCase().indexOf(q) >= 0) && prioMatch(p) })
      if (!inGroup.length) return
      box.appendChild(el('h3', { text: g[1] + '（' + inGroup.length + '）' }))
      SUB.forEach(function (sub) {
        var items = inGroup.filter(function (p) {
          var parts = p.split('/'), seg = parts[1]
          if (sub[0] === '_fin' || sub[0] === '_archived') return seg === sub[0]
          var isTop = seg[0] !== '_' && parts.length === 3
          return sub[0] === '' ? isTop : (seg !== '_fin' && seg !== '_archived' && !isTop)
        })
        if (!items.length) return
        box.appendChild(el('h4', { text: sub[1] }))
        items.sort(function (a, b) { return (listSort === 'prio' ? PRIO_ORDER[priorities[a] || ''] - PRIO_ORDER[priorities[b] || ''] : 0) || (a < b ? -1 : 1) })
        items.forEach(function (p) {
          var name = p.split('/').pop().replace(/\.md$/, '')
          var isDraft = store.draftBranch && drafts.indexOf(store.draftBranch(p)) >= 0
          var others = store.branchesFor ? store.branchesFor(p).filter(function (b) { return b !== 'main' && !/^draft\//.test(b) }) : []
          var b = el('button', { class: p === state.path ? 'on' : '', html: '<span class="t">' + (priorities[p] ? '<span class="prio ' + priorities[p] + '" title="優先度：' + PRIO_LABEL[priorities[p]] + '"></span>' : '') + esc(name) + (isDraft ? '<span class="badge">下書き</span>' : '') + others.map(function (b) { return '<span class="badge br" title="このブランチにも別の版があります">🌿 ' + esc(b) + '</span>' }).join('') + '</span><span class="p">' + esc(p) + '</span>' })
          b.addEventListener('click', function () { if (p === state.path) closeDrawer(); else openArticle(p) })
          box.appendChild(b)
        })
      })
    })
    if (!box.children.length) box.appendChild(el('p', { class: 'hint', style: 'margin:12px', text: q || prioFilter !== 'all' ? '見つかりません（検索・絞り込みを確認）' : '記事がありません' }))
  }

  // ================================================================ 優先度（frontmatter の priority: high / medium / low）
  var PRIO_ORDER = { high: 0, medium: 1, low: 2, '': 3 }
  var PRIO_LABEL = { high: '高', medium: '中', low: '低' }
  var priorities = (function () { try { return JSON.parse(load('priorities') || '{}') || {} } catch (e) { return {} } })()
  function savePriorities() { remember('priorities', JSON.stringify(priorities)) }
  // 一覧の絞り込み（all / none / "high,medium" など）と並べ方（prio / name）。この端末に覚えておく
  var prioFilter = load('prioFilter') || 'all', listSort = load('listSort') || 'prio'
  function prioMatch(p) {
    if (prioFilter === 'all') return true
    var v = priorities[p] || ''
    return prioFilter === 'none' ? !v : prioFilter.split(',').indexOf(v) >= 0
  }
  function setListSort(v) {
    listSort = v; remember('listSort', v)
    document.querySelectorAll('#sortMode button').forEach(function (b) { b.classList.toggle('on', b.dataset.s === v) })
    renderArticleList()
  }
  function normPriority(v) {
    v = String(v || '').trim().toLowerCase()
    if (/^(high|h|高|1)$/.test(v)) return 'high'
    if (/^(medium|mid|m|中|2)$/.test(v)) return 'medium'
    if (/^(low|l|低|3)$/.test(v)) return 'low'
    return ''
  }
  /** frontmatter の1行を書き換える（value が空なら消す）。frontmatter が無ければ先頭に作る */
  function setFrontKey(raw, key, value) {
    var line = key + ': ' + value
    var m = raw.match(/^(﻿?\s*---\n)([\s\S]*?)(\n---\n?)/)
    if (!m) return value ? '---\n' + line + '\n---\n' + raw : raw
    var lines = m[2].split('\n'), re = new RegExp('^' + key + '\\s*:'), i = lines.findIndex(function (l) { return re.test(l) })
    if (i >= 0) { if (value) lines[i] = line; else lines.splice(i, 1) }
    else if (value) lines.push(line)
    return m[1] + lines.join('\n') + m[3] + raw.slice(m[0].length)
  }
  /** 一覧の優先度を、裏で少しずつ読んで埋める（前回の結果はこの端末に覚えておく） */
  async function loadPriorities() {
    var queue = articles.slice(), found = {}
    var refresh = debounce(renderArticleList, 300)
    async function worker() {
      while (queue.length) {
        var p = queue.shift()
        try { found[p] = normPriority(splitFront(await store.read(p)).front.priority) } catch (e) { continue }
        if ((priorities[p] || '') !== found[p]) { priorities[p] = found[p]; refresh() }
      }
    }
    await Promise.all([1, 2, 3, 4, 5, 6].map(worker))
    Object.keys(priorities).forEach(function (p) { if (articles.indexOf(p) < 0) delete priorities[p] })
    savePriorities()
  }
  async function changePriority(v) {
    if (!state.path) return
    var wasDirty = state.dirtyMd || state.dirtyCss
    var text = setFrontKey(state.raw, 'priority', v)
    if (text === state.raw) return
    setRaw(text, true)
    state.front = splitFront(state.raw).front
    priorities[state.path] = v; savePriorities(); renderArticleList()
    // ほかに未保存の変更が無ければ、そのまま保存する（フラグだけの commit）
    if (!wasDirty) await save()
    else status('優先度を変えました（保存で GitHub に入ります）')
  }

  // ================================================================ ブランチの切り替え
  /** ツールバーのブランチ選択を、この記事がある（main と中身が違う）ブランチで埋める */
  async function fillBranches(path) {
    var sel = $('#branchSel'); if (!sel || !store.branchesFor) return
    var list = store.branchesFor(path), cur = await store.currentRef(path)
    if (list.indexOf(cur) < 0) list = list.concat([cur])
    sel.innerHTML = ''
    list.forEach(function (b) { sel.appendChild(el('option', { value: b, text: '🌿 ' + b })) })
    sel.value = cur
    sel.disabled = list.length < 2
    sel.title = list.length < 2 ? 'この記事は ' + cur + ' にしかありません' : '表示するブランチ（保存もこのブランチに入る。main のときは ' + store.draftBranch(path) + ' に保存）'
  }
  async function changeBranch(ref) {
    if (!state.path) return
    if (state.dirtyMd && !confirm('保存していない記事の変更があります。破棄してブランチを切り替えますか？')) { await fillBranches(state.path); return }
    state.dirtyMd = false
    store.setRef(state.path, ref)
    await openArticle(state.path)
    status('🌿 ' + ref + ' を表示中（保存先：' + store.describeSave(state.path) + '）', 'ok')
  }

  // ================================================================ 差分（ブランチ同士の違い）
  var diffSeq = 0
  /** 比べる相手のブランチ（左）→ いま表示しているブランチ（右。未保存の変更も含む）の違いを出す */
  async function renderDiff() {
    var body = $('#diffBody'); if (!body || !state.path || !window.NoeDiff || !store.readAt) return
    var seq = ++diffSeq, path = state.path
    var cur = await store.currentRef(path)
    var others = store.branchesFor(path).filter(function (b) { return b !== cur })
    var sel = $('#diffBase'); sel.innerHTML = ''
    $('#diffCur').textContent = '🌿 ' + cur + (state.dirtyMd ? '（未保存の変更を含む）' : '')
    if (!others.length) {
      $('#diffStats').textContent = ''; $('#diffFiles').innerHTML = ''; $('#diffGh').removeAttribute('href'); sel.disabled = true
      body.innerHTML = '<div class="empty">比べる相手がありません。この記事は ' + esc(cur) + ' にしか無いか、ほかのブランチでも中身が同じです。</div>'
      return
    }
    sel.disabled = false
    others.forEach(function (b) { sel.appendChild(el('option', { value: b, text: '🌿 ' + b })) })
    var base = others.indexOf(state.diffBase) >= 0 ? state.diffBase : others.indexOf('main') >= 0 ? 'main' : others[0]
    sel.value = base; state.diffBase = base
    $('#diffGh').href = store.compareUrl(base, cur)
    body.innerHTML = '<div class="empty">読み込み中…</div>'
    try {
      var results = await Promise.all([store.readAt(path, base), store.folderDiff ? store.folderDiff(path, base, cur).catch(function () { return [] }) : []])
      if (seq !== diffSeq || path !== state.path) return
      var oldText = results[0], files = results[1]
      var rows = NoeDiff.lines(oldText, state.raw), st = NoeDiff.stats(rows)
      $('#diffStats').innerHTML = '<span class="a">+' + st.added + '</span> <span class="d">−' + st.removed + '</span> 行'
      $('#diffFiles').innerHTML = files.length ? '同じフォルダのほかのファイル：' + files.map(function (f) {
        return { added: '＋', removed: '−', changed: '～' }[f.status] + ' ' + esc(f.path.split('/').pop())
      }).join('　') : ''
      if (oldText == null) { body.innerHTML = '<div class="empty">' + esc(base) + ' にはこの記事がありません（全部が新しい行です）。</div>'; appendRows(body, rows); return }
      if (!st.added && !st.removed) { body.innerHTML = '<div class="empty">' + esc(base) + ' と同じ内容です。</div>'; return }
      body.innerHTML = ''
      if (!$('#diffOnly').checked) { appendRows(body, rows); return }
      var hs = NoeDiff.hunks(rows, 3)
      hs.forEach(function (h) {
        if (h.skippedBefore) body.appendChild(skipRow(h.skippedBefore))
        appendRows(body, h.rows)
      })
      if (hs.skippedAfter) body.appendChild(skipRow(hs.skippedAfter))
    } catch (e) {
      if (seq === diffSeq) body.innerHTML = '<div class="empty">差分を出せませんでした：' + esc(saveError(e)) + '</div>'
    }
  }
  function skipRow(n) {
    var d = el('div', { class: 'skip', text: '⋯ 同じ行が ' + n + ' 行（タップで全部表示）' })
    d.addEventListener('click', function () { $('#diffOnly').checked = false; renderDiff() })
    return d
  }
  /** 行を並べる。続けて消えた行と増えた行は、順に組にして、行の中の変わった文字に色を付ける */
  function appendRows(box, rows) {
    var frag = document.createDocumentFragment()
    for (var i = 0; i < rows.length; ) {
      if (rows[i].op !== '-') { frag.appendChild(diffLine(rows[i], null)); i++; continue }
      var dels = [], adds = []
      while (i < rows.length && rows[i].op === '-') dels.push(rows[i++])
      while (i < rows.length && rows[i].op === '+') adds.push(rows[i++])
      var pairs = dels.map(function (d, k) { return adds[k] ? NoeDiff.chars(d.text, adds[k].text) : null })
      dels.forEach(function (d, k) { frag.appendChild(diffLine(d, pairs[k])) })
      adds.forEach(function (a, k) { frag.appendChild(diffLine(a, pairs[k])) })
    }
    box.appendChild(frag)
  }
  function diffLine(r, parts) {
    var cls = r.op === '+' ? 'add' : r.op === '-' ? 'del' : 'ctx', html
    if (parts && r.op !== ' ') {
      html = parts.filter(function (p) { return p.op === ' ' || p.op === r.op }).map(function (p) {
        return p.op === ' ' ? esc(p.text) : (r.op === '+' ? '<ins>' : '<del>') + esc(p.text) + (r.op === '+' ? '</ins>' : '</del>')
      }).join('')
    } else html = esc(r.text)
    return el('div', { class: 'dl ' + cls, html: '<span class="n">' + (r.a || '') + '</span><span class="n">' + (r.b || '') + '</span><span class="s">' + (r.op === ' ' ? '' : r.op === '-' ? '−' : '+') + '</span><span class="t">' + (html || '&#8203;') + '</span>' })
  }

  // ================================================================ GitHub で開く・移動・削除
  var ghUrl = ''
  async function updateGhLink() {
    ghUrl = ''; $('#ghLink').href = '#'
    if (!store.webUrl || !state.path) return
    var path = state.path
    try { var u = await store.webUrl(path); if (path === state.path) { ghUrl = u; $('#ghLink').href = u } } catch (e) {}
  }
  function copyGhLink(ev) {
    if (!ghUrl) { ev.preventDefault(); status('GitHub の場所を確認中です。少し待ってからもう一度', 'err'); return }
    // 開くのはリンクそのもの（target=_blank）。ついでにクリップボードにも入れる
    try { navigator.clipboard.writeText(ghUrl).then(function () { status('GitHub のリンクをコピーしました', 'ok') }, function () {}) } catch (e) {}
  }
  function parentOf(p) { return p.replace(/\/[^/]+$/, '') }
  function moveTargets() {
    var set = { 'dev': 1, 'blog': 1, 'dev/_fin': 1, 'blog/_fin': 1, 'dev/_archived': 1, 'blog/_archived': 1 }
    articles.forEach(function (p) { set[parentOf(store.unitOf(p).path)] = 1 })
    var here = parentOf(store.unitOf(state.path).path)
    return Object.keys(set).filter(function (d) { return d !== here }).sort()
  }
  function openFileDlg() {
    if (!state.path) return
    var unit = store.unitOf(state.path)
    $('#fileDlgPath').textContent = state.path
    $('#fileDlgUnit').textContent = unit.dir ? 'フォルダ「' + unit.path + '」ごと（画像も一緒に）動かす／消す' : 'この .md ファイルだけを動かす／消す'
    var sel = $('#moveDest'); sel.innerHTML = ''
    moveTargets().forEach(function (d) { sel.appendChild(el('option', { value: d, text: d + '/' })) })
    $('#fileDlg').showModal()
  }
  function needSaved() {
    if (!state.dirtyMd) return false
    alert('保存していない変更があります。先に保存してから、移動・削除してください')
    return true
  }
  async function moveArticle() {
    if (needSaved()) return
    var dest = $('#moveDest').value, from = state.path; if (!dest) return
    if (!confirm(store.unitOf(from).path + '\n→ ' + dest + '/\nに移動します。よろしいですか？')) return
    $('#fileDlg').close(); status('移動中…')
    try {
      var r = await store.move(from, dest)
      articles = await store.list()
      if (priorities[from] != null) { priorities[r.path] = priorities[from]; delete priorities[from]; savePriorities() }
      await openArticle(r.path)
      status('移動しました', 'ok')
      showReport([{ icon: '✅', kind: 'ok', title: '移動しました', detail: from + ' → ' + r.path }].concat(r.done.map(function (d) { return { icon: '・', title: d.where, detail: d.detail } })))
    } catch (e) {
      status('移動できませんでした', 'err')
      showReport([{ icon: '❌', kind: 'err', title: '移動できませんでした', detail: saveError(e) }])
    }
  }
  async function deleteArticle() {
    if (needSaved()) return
    var path = state.path, unit = store.unitOf(path)
    if (!confirm((unit.dir ? 'フォルダ「' + unit.path + '」を画像ごと' : '「' + path + '」を') + '削除します。\n（Git の履歴からは戻せます）よろしいですか？')) return
    $('#fileDlg').close(); status('削除中…')
    try {
      var done = await store.remove(path)
      delete priorities[path]; savePriorities()
      articles = await store.list()
      state.path = null; state.raw = ''; state.dirtyMd = false; markDirty()
      $('#articleName').textContent = '記事'; renderArticleList(); openDrawer()
      status('削除しました', 'ok')
      showReport([{ icon: '🗑', kind: 'ok', title: '削除しました', detail: path }].concat(done.map(function (d) { return { icon: '・', title: d.where, detail: d.detail } })))
    } catch (e) {
      status('削除できませんでした', 'err')
      showReport([{ icon: '❌', kind: 'err', title: '削除できませんでした', detail: saveError(e) }])
    }
  }

  // ================================================================ 公開（PR なしで main に直接）
  async function publishArticle() {
    if (editing) commitEdit()
    if (!state.path) { status('記事を選んでください', 'err'); return }
    if (state.dirtyMd || state.dirtyCss) { alert('保存していない変更があります。先に保存して、プレビューを確認してから公開してください'); return }
    var path = state.path, raw = state.raw, front = splitFront(raw).front, url = previewUrl().replace(/\/preview$/, '')
    var btn = $('#publish'); btn.disabled = true
    var report = function (kind, icon, title, detail, link) { status(title, kind); showReport([{ icon: icon, kind: kind, title: title, detail: detail, link: link }]) }
    try {
      status('画像を確認中…')
      var missing = await store.missingImages(path, raw)
      if (missing.length) { report('err', '⏸', '公開していません', '画像が足りません：' + missing.join('、')); return }
      if (!confirm('本当に公開しますか？\n\n' + (front.title || path) + '\n' + url + '\n\nすぐに誰でも読めるようになります。公開できた記事は noe-posts の main から自動で消え、正本はサイトの DB に移ります。')) { status('公開をやめました'); return }
      if (state.path !== path || state.raw !== raw) throw new Error('確認中に記事が変わりました。もう一度やり直してください')
      status('公開の準備中…')
      var r = await store.publish(path, raw, setFrontKey(raw, 'status', 'published'))
      report('', '⏳', '公開を送信中', 'main に入れました（commit ' + r.sha.slice(0, 7) + '）。サイトへの反映を待っています…')
      store.watchSend(r.sha, function (u) {
        var log = u.url && { href: u.url, text: 'ログ' }
        if (u.state === 'success') report('ok', '✅', '公開の処理が終わりました', '記事を確認してください：', { href: url, text: '開く' })
        else if (u.state === 'failure') report('err', '❌', '公開の処理が失敗しました', (u.reason || '理由はログで確認してください') + '（main には入っています。直ったあとは GitHub の Actions から Re-run）', log)
        else if (u.state === 'noperm' || u.state === 'none') report('', 'ℹ️', '公開の結果は確認できません', 'main には入っています。GitHub の Actions で確認してください')
        else report('', '⏳', '公開を送信中', 'サイトへの反映を待っています…', log)
      }, 'publish')
    } catch (e) {
      report('err', '❌', '公開できませんでした', saveError(e))
    } finally { btn.disabled = false }
  }

  // ================================================================ 起動
  var started = false
  async function start() {
    if (store.init && !store.config()) {
      try { await store.init() } catch (e) { status(e.message, 'err'); return }
    }
    if (!store.ready()) {
      status(store.kind === 'payload' ? '設定でリポジトリの URL と GitHub の鍵を入れてください' : '⚙︎ から GitHub の鍵を入れてください', 'err')
      settings(); return
    }
    if (started) return
    started = true
    try {
      state.articleCss = await store.read('_assets/md/article.css')
      state.edits = parseGui(splitGui(state.articleCss).gui); renderEdits(); renderGroups()
      articles = await store.list()
      renderArticleList()
      loadPriorities()
      var last = load('article'), first = articles.indexOf(last) >= 0 ? last : articles[0]
      if (first) openArticle(first); else openDrawer()
    } catch (e) { started = false; status('読み込めませんでした：' + e.message, 'err') }
  }
  function imageSections() {
    var parts = splitFront(state.raw), lines = parts.body.split('\n')
    var tokens = md.parse(prepareKeepLines(parts.body), {})
    var headings = tokens.filter(function (token) {
      return token.type === 'heading_open' && token.level === 0 && /^h[23]$/.test(token.tag)
    })
    var sections = headings.map(function (heading, i) {
      var title = tokens[tokens.indexOf(heading) + 1].content
      var end = headings[i + 1] ? headings[i + 1].map[0] : lines.length
      return { label: title || 'セクション ' + (i + 1), end: parts.fmLines + end, text: lines.slice(heading.map[0], end).join('\n') }
    })
    return sections.length ? sections : [{ label: '本文の末尾', end: parts.fmLines + lines.length, text: parts.body }]
  }

  function openImageStudio(mode) {
    var path = state.path
    window.NoeImageStudio.open(mode, {
      sections: imageSections,
      context: function (section) {
        var parts = splitFront(state.raw)
        return [parts.front.title, parts.front.description, section ? section.text : parts.body].filter(Boolean).join('\n').slice(0, 6000)
      },
      adopt: function (kind, section, description, image) {
        if (state.path !== path || $('#save').disabled) throw new Error('記事を開き直して、もう一度お試しください')
        var name = 'mpm-' + kind + '-' + crypto.randomUUID() + '.webp'
        var dir = path.split('/').slice(0, -1).join('/')
        var text
        if (kind === 'hero') text = setFrontKey(state.raw, 'hero', './' + name)
        else {
          if (!section) throw new Error('画像を入れるセクションを選んでください')
          var lines = state.raw.split('\n')
          var caption = description.replace(/[\\[\]]/g, '\\$&')
          var before = lines.slice(0, section.end).join('\n').trimEnd()
          var after = lines.slice(section.end).join('\n')
          text = before + '\n\n![' + caption + '](./' + name + ')\n' + (after ? '\n' + after : '')
        }
        state.pendingImages[dir + '/' + name] = image
        setRaw(text, true)
        status('画像を採用しました。記事と画像を保存できます', 'ok')
      },
    })
  }

  function initImageStudio() {
    if (store.kind !== 'payload') return
    var menu = $('#imageModes')
    $('#imageStudioOpen').hidden = false
    $('#imageStudioOpen').addEventListener('click', function () {
      if (!state.path) { status('先に記事を選んでください'); return }
      if ($('#save').disabled) return
      if (editing) commitEdit()
      menu.returnValue = ''
      menu.showModal()
    })
    menu.addEventListener('close', function () {
      if (['hero', 'body', 'both'].includes(menu.returnValue)) openImageStudio(menu.returnValue)
    })
    $('#imageSettingsOpen').addEventListener('click', function () {
      this.closest('dialog').close()
      openImageStudio('settings')
    })
  }

  function init() {
    initImageStudio()
    if (store.allowStyle === false) document.body.classList.add('no-style')
    document.body.classList.add('store-' + store.kind)
    document.querySelectorAll('#device button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#device button').forEach(function (x) { x.classList.remove('on') }); b.classList.add('on')
        state.width = Number(b.dataset.w); remember('width', b.dataset.w); fitStage(true)
      })
    })
    var w = load('width'); if (w) { state.width = Number(w); document.querySelectorAll('#device button').forEach(function (x) { x.classList.toggle('on', x.dataset.w === w) }) }
    document.querySelectorAll('#view button').forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.v) }) })
    document.querySelectorAll('#mode button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.m) }) })
    document.querySelectorAll('#textbar button').forEach(function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault() })
      b.addEventListener('click', function () { textCmd(b.dataset.cmd) })
    })
    window.addEventListener('resize', function () { fitStage(false); rebuildMirrorSoon() })
    $('#barHide').addEventListener('click', function () { document.body.classList.add('bar-hidden'); setTimeout(function () { fitStage(false) }, 0) })
    $('#barShow').addEventListener('click', function () { document.body.classList.remove('bar-hidden'); setTimeout(function () { fitStage(false) }, 0) })
    $('#reload').addEventListener('click', function () { if (state.dirtyMd && !confirm('保存していない記事の変更を捨てて読み直しますか？')) return; cache = {}; if (state.path) { state.dirtyMd = false; openArticle(state.path) } })
    $('#articleBtn').addEventListener('click', openDrawer)
    if (store.remove && store.move) document.body.classList.add('has-file-ops')
    $('#priority').addEventListener('change', function () { changePriority($('#priority').value) })
    $('#branchSel').addEventListener('change', function () { changeBranch($('#branchSel').value) })
    $('#diffBase').addEventListener('change', function () { state.diffBase = $('#diffBase').value; renderDiff() })
    $('#diffOnly').addEventListener('change', renderDiff)
    $('#ghLink').addEventListener('click', copyGhLink)
    $('#fileBtn').addEventListener('click', openFileDlg)
    $('#publish').addEventListener('click', publishArticle)
    $('#moveBtn').addEventListener('click', moveArticle)
    $('#deleteBtn').addEventListener('click', deleteArticle)
    $('#drawerClose').addEventListener('click', closeDrawer); $('#drawerScrim').addEventListener('click', closeDrawer)
    $('#articleSearch').addEventListener('input', renderArticleList)
    $('#prioFilter').value = prioFilter
    $('#prioFilter').addEventListener('change', function () { prioFilter = $('#prioFilter').value; remember('prioFilter', prioFilter); renderArticleList() })
    document.querySelectorAll('#sortMode button').forEach(function (b) { b.addEventListener('click', function () { setListSort(b.dataset.s) }) })
    setListSort(listSort)
    $('#panelToggle').addEventListener('click', function () { setPanelCollapsed(!document.body.classList.contains('panel-collapsed')) })
    $('#save').addEventListener('click', save); $('#undo').addEventListener('click', undo)
    $('#reportClose').addEventListener('click', function () { showReport([]) })
    $('#settings').addEventListener('click', settings); $('#tokenSave').addEventListener('click', saveToken)
    $('#tokenClear').addEventListener('click', function () { if (store.setToken) store.setToken(null); $('#tokenResult').textContent = '鍵を消しました' })
    $('#selector').addEventListener('change', function () {
      var v = $('#selector').value
      if (v === '__custom') { $('#selectorCustom').hidden = false; $('#selectorCustom').focus(); return }
      $('#selectorCustom').hidden = true; chooseSelector(v)
    })
    $('#selectorCustom').addEventListener('change', function () { var v = $('#selectorCustom').value.trim(); if (count(v) >= 0) chooseSelector(v) })
    document.querySelectorAll('input[name=media]').forEach(function (r) { r.addEventListener('change', function () { state.media = r.value; renderGroups(); renderMore() }) })
    $('#propSearch').addEventListener('input', renderMore)
    var ta = $('#mdText')
    ta.addEventListener('input', function () { setRaw(ta.value, false); renderSoon(); rebuildMirrorSoon() })
    ta.addEventListener('scroll', syncPreviewFromMd, { passive: true })
    $('#stage').addEventListener('scroll', syncMdFromPreview, { passive: true })
    textbarState(false)
    var v0 = load('view') || 'preview'; setView(v0 === 'diff' && !store.readAt ? 'preview' : v0)
    start()
  }
  // テスト用（ブラウザのコンソールから行の位置を確かめられる）
  window.__noeDebug = { lineTops: function () { return lineTops }, mdLineAtTop: mdLineAtTop, blocks: previewBlocks, buildMirror: buildMirror }
  init()
})()
