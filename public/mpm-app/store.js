/*
 * store.js — エディタの「読み書き先」。同じエディタが 3 つの場所で動く。
 *
 *   payload … noe-shiftica の管理画面のタブ（/admin/markdown-post-manager → /mpm-app/index.html）。
 *            GitHub との通信はサーバーの /api/mpm/github が設定の鍵を付けて中継する（ブラウザは鍵を持たない）。
 *            リポジトリは管理画面の「Markdown Post Manager 設定」で入れる
 *
 *   local  … preview_server.py（Pythonista / Mac）で開いたとき。手元の noe-posts を直接読み書き
 *   github … Netlify などで開いたとき。GitHub の API で azmok/noe-posts を読み書き
 *            （鍵＝noe-posts だけを読み書きできる Fine-grained token。この端末の中だけに保存）
 *
 * 保存のルール（github）：
 *   - 記事（dev/・blog/ の .md）… draft/<フォルダ名> ブランチに commit（無ければ main から作る）
 *     → noe-posts の draft.yml が動き、本番の下書きプレビューにも反映される
 *   - 見た目（_assets/md/article.css）… main に commit → assets-to-site.yml がサイトに PR を出す
 *   - 記事を読むときは、下書きブランチがあればそちらの最新を読む
 */
(function (global) {
  'use strict'

  var REPO = 'azmok/noe-posts'
  var API = 'https://api.github.com'
  var TOKEN_KEY = 'noe-editor:gh-token'
  var isPayload = location.pathname.indexOf('/mpm-app/') === 0
  var isLocal = !isPayload && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  var payloadConfig = null // { repo, hasToken, tokenHint, settingsUrl }

  function lsGet(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch (e) {} }

  var NOTES = /(^|\/)(CLAUDE\.md|IMPLEMENTATION PROMPTS\.md)$|\.(claude|gemini)\.md$/
  function isArticle(path) { return /^(dev|blog)\/.+\.md$/.test(path) && !NOTES.test(path) }
  function sortArticles(list) { return list.sort(function (a, b) { return (a.split('/_').length - b.split('/_').length) || (a < b ? -1 : 1) }) }

  /** 記事の下書きブランチ名：記事が入っているフォルダ名（dev/<slug>/<slug>.md → draft/<slug>） */
  function draftBranch(path) {
    var parts = path.split('/')
    var folder = parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1].replace(/\.md$/, '')
    return 'draft/' + folder.replace(/[^\w.-]+/g, '-')
  }

  /**
   * 本文が使っている画像（記事フォルダからの相対パス）。noe-shiftica の scripts/publish-article.mjs の
   * referencedImagesAll と同じ規則（下書き送信の Action はこの画像が全部そろっていないと失敗する）
   */
  function referencedImages(md) {
    var files = {}, inFence = false
    function add(raw) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/|#|data:)/i.test(raw)) return
      if (/(^|\/)_assets\//.test(raw)) return
      var src = raw; try { src = decodeURI(raw) } catch (e) {}
      if (/\.(png|jpe?g|gif|webp|svg)$/i.test(src)) files[src.replace(/^\.\//, '')] = 1
    }
    md.split('\n').forEach(function (line) {
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return }
      if (inFence) return
      var m, re1 = /!\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/g, re2 = /<img\b[^>]*?\bsrc=["']([^"']+)["']/gi
      while ((m = re1.exec(line))) add(m[1])
      while ((m = re2.exec(line))) add(m[1])
    })
    return Object.keys(files)
  }
  function dirOf(path) { return path.replace(/\/[^/]+$/, '') }
  function joinPath(dir, rel) {
    var out = dir.split('/')
    rel.split('/').forEach(function (seg) { if (seg === '..') out.pop(); else if (seg && seg !== '.') out.push(seg) })
    return out.join('/')
  }

  // ------------------------------------------------------------------ local（preview_server.py）
  var local = {
    kind: 'local',
    label: '手元のファイル（preview_server.py）',
    ready: function () { return true },
    list: async function () {
      var r = await fetch('/__list', { cache: 'no-store' }); if (!r.ok) throw new Error('記事一覧を取れません（' + r.status + '）')
      return (await r.json()).articles
    },
    read: async function (path) {
      var r = await fetch('/' + encodeURI(path), { cache: 'no-store' }); if (!r.ok) throw new Error(r.status + ' ' + path)
      return r.text()
    },
    assetUrl: async function (path) { return '/' + encodeURI(path) },
    write: async function (path, content) {
      var r = await fetch('/__save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: path, content: content }) })
      var j = await r.json(); if (!r.ok) throw new Error(j.error || r.status)
      return { where: '手元の ' + path }
    },
    /** 本文が使っている画像のうち、フォルダに無いもの */
    missingImages: async function (path, md) {
      var dir = dirOf(path), missing = []
      await Promise.all(referencedImages(md).map(async function (rel) {
        var r = await fetch('/' + encodeURI(joinPath(dir, rel)), { method: 'HEAD', cache: 'no-store' }).catch(function () { return { ok: false } })
        if (!r.ok) missing.push(rel)
      }))
      return missing.sort()
    },
    describeSave: function (path) { return '手元のファイルに保存' },
  }

  // ------------------------------------------------------------------ github
  var shaCache = {}      // "ref:path" → sha（上書き保存に必要）
  var branchCache = null // 下書きブランチの一覧
  var blobCache = {}

  function token() { return lsGet(TOKEN_KEY) }
  async function api(path, opts) {
    opts = opts || {}
    var r
    if (isPayload) {
      // サーバー（管理画面のセッション）経由。鍵はサーバーが付ける
      r = await fetch('/api/mpm/github?path=' + encodeURIComponent(path), {
        method: opts.method || 'GET', credentials: 'same-origin', cache: 'no-store', body: opts.body,
        headers: Object.assign({ Accept: 'application/vnd.github+json' }, opts.headers || {}),
      })
    } else {
      var headers = Object.assign({ Authorization: 'Bearer ' + token(), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, opts.headers || {})
      r = await fetch(API + path, { method: opts.method || 'GET', headers: headers, body: opts.body, cache: 'no-store' })
    }
    if (opts.raw) { if (!r.ok) throw new Error('GitHub ' + r.status + ' ' + path); return r }
    var j = r.status === 204 ? {} : await r.json().catch(function () { return {} })
    if (!r.ok) { var e = new Error('GitHub ' + r.status + '：' + (j.message || path)); e.status = r.status; throw e }
    return j
  }
  function enc(path) { return path.split('/').map(encodeURIComponent).join('/') }
  function b64decode(s) {
    var bin = atob(s.replace(/\n/g, '')), bytes = new Uint8Array(bin.length)
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new TextDecoder('utf-8').decode(bytes)
  }
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str), bin = ''
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
    return btoa(bin)
  }
  async function draftBranches(force) {
    if (branchCache && !force) return branchCache
    var list = [], page = 1
    for (;;) {
      var bs = await api('/repos/' + REPO + '/branches?per_page=100&page=' + page)
      bs.forEach(function (b) { if (/^draft\//.test(b.name)) list.push(b.name) })
      if (bs.length < 100) break
      page++
    }
    branchCache = list
    return list
  }
  async function refFor(path) {
    if (!isArticle(path)) return 'main'
    var b = draftBranch(path)
    return (await draftBranches()).indexOf(b) >= 0 ? b : 'main'
  }
  async function ensureBranch(branch) {
    try { await api('/repos/' + REPO + '/git/ref/heads/' + enc(branch)); return }
    catch (e) { if (e.status !== 404) throw e }
    var main = await api('/repos/' + REPO + '/git/ref/heads/main')
    await api('/repos/' + REPO + '/git/refs', { method: 'POST', body: JSON.stringify({ ref: 'refs/heads/' + branch, sha: main.object.sha }) })
    if (branchCache) branchCache.push(branch)
  }

  var github = {
    kind: 'github',
    label: 'GitHub（' + REPO + '）',
    ready: function () { return !!token() },
    setToken: function (t) { lsSet(TOKEN_KEY, t || null); branchCache = null },
    hasToken: function () { return !!token() },
    check: async function () { var r = await api('/repos/' + REPO); return r.full_name + (r.private ? '（非公開）' : '') },
    list: async function () {
      var tree = await api('/repos/' + REPO + '/git/trees/main?recursive=1')
      var set = {}
      tree.tree.forEach(function (n) { if (n.type === 'blob' && isArticle(n.path)) set[n.path] = 1 })
      // 下書きブランチにしか無い新しい記事も出す
      var branches = await draftBranches(true)
      await Promise.all(branches.map(async function (b) {
        try {
          var t = await api('/repos/' + REPO + '/git/trees/' + enc(b) + '?recursive=1')
          t.tree.forEach(function (n) { if (n.type === 'blob' && isArticle(n.path) && draftBranch(n.path) === b) set[n.path] = 1 })
        } catch (e) {}
      }))
      return sortArticles(Object.keys(set))
    },
    read: async function (path) {
      var ref = await refFor(path)
      var j = await api('/repos/' + REPO + '/contents/' + enc(path) + '?ref=' + encodeURIComponent(ref))
      shaCache[ref + ':' + path] = j.sha
      if (j.content != null && j.encoding === 'base64' && j.content) return b64decode(j.content)
      // 1MB を超えるファイルは raw で取る
      var r = await api('/repos/' + REPO + '/contents/' + enc(path) + '?ref=' + encodeURIComponent(ref), { raw: true, headers: { Accept: 'application/vnd.github.raw' } })
      return r.text()
    },
    assetUrl: async function (path) {
      if (blobCache[path]) return blobCache[path]
      var ref = await refFor(path.replace(/\/[^/]+$/, '/x.md'))
      try {
        var r = await api('/repos/' + REPO + '/contents/' + enc(path) + '?ref=' + encodeURIComponent(ref), { raw: true, headers: { Accept: 'application/vnd.github.raw' } })
        var blob = await r.blob()
        var type = /\.svg$/i.test(path) ? 'image/svg+xml' : blob.type
        blobCache[path] = URL.createObjectURL(type !== blob.type ? new Blob([blob], { type: type }) : blob)
      } catch (e) { blobCache[path] = '' }
      return blobCache[path]
    },
    write: async function (path, content) {
      var branch = isArticle(path) ? draftBranch(path) : 'main'
      if (branch !== 'main') await ensureBranch(branch)
      var key = branch + ':' + path, sha = shaCache[key]
      if (!sha) { try { sha = (await api('/repos/' + REPO + '/contents/' + enc(path) + '?ref=' + encodeURIComponent(branch))).sha } catch (e) { if (e.status !== 404) throw e } }
      var msg = isArticle(path) ? 'draft: ' + path.split('/').pop() + '（エディタから）' : 'style: ' + path + '（エディタから）'
      var res = await api('/repos/' + REPO + '/contents/' + enc(path), { method: 'PUT', body: JSON.stringify({ message: msg, content: b64encode(content), sha: sha, branch: branch }) })
      shaCache[key] = res.content.sha
      return { where: branch + ' ブランチ', branch: branch, sha: res.commit && res.commit.sha }
    },
    /** 本文が使っている画像のうち、保存先ブランチ（無ければ main）のフォルダに無いもの */
    missingImages: async function (path, md) {
      var refs = referencedImages(md); if (!refs.length) return []
      var ref = await refFor(path), dir = dirOf(path), have = {}
      var dirs = {}
      refs.forEach(function (rel) { dirs[dirOf(joinPath(dir, rel))] = 1 })
      await Promise.all(Object.keys(dirs).map(async function (d) {
        try {
          var list = await api('/repos/' + REPO + '/contents/' + enc(d) + '?ref=' + encodeURIComponent(ref))
          ;(Array.isArray(list) ? list : []).forEach(function (n) { have[n.path] = 1 })
        } catch (e) { if (e.status !== 404) throw e }
      }))
      return refs.filter(function (rel) { return !have[joinPath(dir, rel)] }).sort()
    },
    /**
     * 保存（commit）をきっかけに動いた「下書き送信」Action の結果を待つ。
     * onUpdate({ state: 'waiting'|'running'|'success'|'failure'|'noperm'|'none', url, reason })
     */
    watchSend: async function (sha, onUpdate) {
      var started = Date.now(), seen = false
      for (;;) {
        var runs
        try { runs = await api('/repos/' + REPO + '/actions/runs?head_sha=' + sha + '&per_page=10') }
        catch (e) {
          if (e.status === 403 || e.status === 404) return onUpdate({ state: 'noperm' })
          return onUpdate({ state: 'failure', reason: '結果を確認できませんでした（' + e.message + '）' })
        }
        var run = (runs.workflow_runs || []).filter(function (r) { return /draft\.yml$/.test(r.path || '') || r.name === 'Draft' })[0]
        if (run) {
          seen = true
          if (run.status !== 'completed') onUpdate({ state: 'running', url: run.html_url })
          else if (run.conclusion === 'success') return onUpdate({ state: 'success', url: run.html_url })
          else return onUpdate({ state: 'failure', url: run.html_url, reason: await failureReason(run) })
        } else onUpdate({ state: 'waiting' })
        if (Date.now() - started > (seen ? 600000 : 90000)) return onUpdate({ state: seen ? 'failure' : 'none', reason: seen ? '10分たっても終わりませんでした' : '' })
        await new Promise(function (r) { setTimeout(r, 6000) })
      }
    },
    describeSave: function (path) { return isArticle(path) ? draftBranch(path) + ' ブランチに commit' : 'main に commit' },
  }

  /** 失敗した Action の理由（send-articles.sh が ::error で残した一文）。取れなければ空 */
  async function failureReason(run) {
    try {
      var jobs = await api('/repos/' + REPO + '/actions/runs/' + run.id + '/jobs')
      var msgs = []
      for (var i = 0; i < (jobs.jobs || []).length; i++) {
        var ann = await api('/repos/' + REPO + '/check-runs/' + jobs.jobs[i].id + '/annotations').catch(function () { return [] })
        ;(ann || []).forEach(function (a) { if (a.annotation_level === 'failure' && !/exit code/.test(a.message || '')) msgs.push(a.message) })
      }
      return msgs.join(' / ')
    } catch (e) { return '' }
  }

  local.knownDrafts = function () { return [] }
  local.draftBranch = github.draftBranch = draftBranch
  github.knownDrafts = function () { return branchCache || [] }
  // ------------------------------------------------------------------ payload（管理画面のタブ）
  var payload = Object.assign({}, github, {
    kind: 'payload',
    allowStyle: false, // 見た目の調整は styleEditor（設計書フェーズ4）で行う
    init: async function () {
      var r = await fetch('/api/mpm/config', { credentials: 'same-origin', cache: 'no-store' })
      if (r.status === 401) throw new Error('管理画面にログインしてください')
      payloadConfig = await r.json()
      if (payloadConfig.repo) REPO = payloadConfig.repo
      return payloadConfig
    },
    ready: function () { return !!(payloadConfig && payloadConfig.repo && payloadConfig.hasToken) },
    config: function () { return payloadConfig },
    setToken: undefined,
    hasToken: function () { return !!(payloadConfig && payloadConfig.hasToken) },
  })

  Object.defineProperty(payload, 'label', { get: function () { return 'GitHub（' + ((payloadConfig && payloadConfig.repo) || '未設定') + '）を管理画面の中継で' } })

  global.NoeStore = isPayload ? payload : isLocal ? local : github
  global.NoeStore.isArticle = isArticle
  global.NoeStore.draftBranch = draftBranch
  global.NoeStore.referencedImages = referencedImages
})(window)
