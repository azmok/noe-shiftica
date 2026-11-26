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
 *   - 公開（publish）… 記事フォルダを status: published にして main に直接 commit → publish.yml が公開する（PR なし）
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
  var allBranchCache = null // main 以外の全ブランチ
  var onBranches = {}    // 記事のパス → main と中身が違う（または main に無い）ブランチの一覧（list() で作る）
  var refOverride = {}   // 記事フォルダ → 表示・保存に使うブランチ（ツールバーで選んだもの）
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
      bs.forEach(function (b) { if (b.name !== 'main') list.push(b.name) })
      if (bs.length < 100) break
      page++
    }
    allBranchCache = list
    branchCache = list.filter(function (b) { return /^draft\//.test(b) })
    return branchCache
  }
  async function refFor(path) {
    if (!isArticle(path) && !/^(dev|blog)\//.test(path)) return 'main'
    var o = refOverride[dirOf(path)]
    if (o) return o
    if (!isArticle(path)) path = dirOf(path) + '/x.md'
    var b = draftBranch(path)
    if ((await draftBranches()).indexOf(b) >= 0) return b
    // main に無く、ほかのブランチ（editorial/ など）にだけある記事は、そのブランチから読む
    var d = dirOf(path), only = Object.keys(onBranches).filter(function (k) {
      return k.indexOf('main:') !== 0 && dirOf(k) === d && !onBranches['main:' + k]
    })[0]
    return only ? onBranches[only][0] : 'main'
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
      var set = {}, mainSha = {}, found = {}
      tree.tree.forEach(function (n) { if (n.type === 'blob' && isArticle(n.path)) { set[n.path] = 1; mainSha[n.path] = n.sha } })
      // ほかのブランチで中身が違う記事（ブランチにしか無い新しい記事も）を集める
      await draftBranches(true)
      await Promise.all(allBranchCache.map(async function (b) {
        try {
          var t = await api('/repos/' + REPO + '/git/trees/' + enc(b) + '?recursive=1')
          t.tree.forEach(function (n) {
            if (n.type !== 'blob' || !isArticle(n.path) || mainSha[n.path] === n.sha) return
            // 下書きブランチは、そのフォルダの記事だけ（main を取り込んだときの古い版を拾わない）
            if (/^draft\//.test(b) && draftBranch(n.path) !== b) return
            set[n.path] = 1
            ;(found[n.path] = found[n.path] || []).push(b)
          })
        } catch (e) {}
      }))
      Object.keys(found).forEach(function (p) { found[p].sort() })
      onBranches = found
      Object.keys(mainSha).forEach(function (p) { onBranches['main:' + p] = true })
      return sortArticles(Object.keys(set))
    },
    /** この記事を表示できるブランチ（main にあれば main、ほかは main と中身が違うもの） */
    branchesFor: function (path) {
      return (onBranches['main:' + path] ? ['main'] : []).concat(onBranches[path] || [])
    },
    /** 指定したブランチでファイルを読む（無ければ null）。差分表示用 */
    readAt: async function (path, ref) {
      try {
        var r = await api('/repos/' + REPO + '/contents/' + enc(path) + '?ref=' + encodeURIComponent(ref), { raw: true, headers: { Accept: 'application/vnd.github.raw' } })
        return await r.text()
      } catch (e) { if (/ 404 /.test(e.message + ' ')) return null; throw e }
    },
    /** 記事のまとまり（フォルダ）の中で、2つのブランチで違うファイル（.md 本体以外。画像など） */
    folderDiff: async function (path, refA, refB) {
      var unit = unitOf(path)
      if (!unit.dir) return []
      var a = shaMap(await entriesUnder(refA, unit)), b = shaMap(await entriesUnder(refB, unit)), out = []
      Object.keys(Object.assign({}, a, b)).sort().forEach(function (p) {
        if (p === path) return
        if (!a[p]) out.push({ path: p, status: 'added' })
        else if (!b[p]) out.push({ path: p, status: 'removed' })
        else if (a[p].sha !== b[p].sha) out.push({ path: p, status: 'changed' })
      })
      return out
    },
    /** GitHub の「ブランチを比べる」画面の URL */
    compareUrl: function (refA, refB) { return 'https://github.com/' + REPO + '/compare/' + enc(refA) + '...' + enc(refB) },
    /** いま表示しているブランチ */
    currentRef: function (path) { return refFor(path) },
    /** 表示・保存するブランチを選ぶ（null で自動：下書きブランチがあればそちら、無ければ main） */
    setRef: function (path, ref) {
      var d = dirOf(path)
      if (ref) refOverride[d] = ref; else delete refOverride[d]
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
      var ref = await refFor(path), key = ref + ':' + path
      if (blobCache[key]) return blobCache[key]
      try {
        var r = await api('/repos/' + REPO + '/contents/' + enc(path) + '?ref=' + encodeURIComponent(ref), { raw: true, headers: { Accept: 'application/vnd.github.raw' } })
        var blob = await r.blob()
        var type = /\.svg$/i.test(path) ? 'image/svg+xml' : blob.type
        blobCache[key] = URL.createObjectURL(type !== blob.type ? new Blob([blob], { type: type }) : blob)
      } catch (e) { blobCache[key] = '' }
      return blobCache[key]
    },
    write: async function (path, content, images, original) {
      // 記事：選んだブランチ（main 以外）があればそこへ、無ければ下書きブランチへ。main には直接書かない
      var picked = isArticle(path) && refOverride[dirOf(path)]
      var branch = isArticle(path) ? (picked && picked !== 'main' ? picked : draftBranch(path)) : 'main'
      if (branch !== 'main' && branch !== picked) await ensureBranch(branch)
      var msg = isArticle(path) ? 'draft: ' + path.split('/').pop() + '（エディタから）' : 'style: ' + path + '（エディタから）'
      if (images && Object.keys(images).length) {
        var head = (await api('/repos/' + REPO + '/git/ref/heads/' + enc(branch))).object.sha
        var current = await github.readAt(path, head)
        if (current == null || current.replace(/\r\n/g, '\n') !== original) {
          throw new Error('保存先の記事が先に更新されました。変更を確認してからやり直してください')
        }
        var contents = Object.assign({}, images)
        contents[path] = b64encode(content)
        var changes = {}
        await Promise.all(Object.keys(contents).map(async function (file) {
          var blob = await api('/repos/' + REPO + '/git/blobs', {
            method: 'POST', body: JSON.stringify({ content: contents[file], encoding: 'base64' }),
          })
          changes[file] = { sha: blob.sha }
        }))
        var commit = await commitTree(branch, changes, msg, head)
        refOverride[dirOf(path)] = branch
        await draftBranches(true).catch(function () {})
        return { where: branch + ' ブランチ', branch: branch, sha: commit }
      }
      var key = branch + ':' + path, sha = shaCache[key]
      if (!sha) { try { sha = (await api('/repos/' + REPO + '/contents/' + enc(path) + '?ref=' + encodeURIComponent(branch))).sha } catch (e) { if (e.status !== 404) throw e } }
      var res = await api('/repos/' + REPO + '/contents/' + enc(path), { method: 'PUT', body: JSON.stringify({ message: msg, content: b64encode(content), sha: sha, branch: branch }) })
      shaCache[key] = res.content.sha
      return { where: branch + ' ブランチ', branch: branch, sha: res.commit && res.commit.sha }
    },
    /** 本文が使っている画像のうち、保存先ブランチ（無ければ main）のフォルダに無いもの */
    missingImages: async function (path, md, pending) {
      var refs = referencedImages(md)
      var frontmatter = md.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
      var hero = frontmatter && frontmatter[1].match(/^hero:\s*\.\/(mpm-hero-[\da-f-]+\.webp)[ \t]*\r?$/m)
      if (hero && refs.indexOf(hero[1]) < 0) refs.push(hero[1])
      if (!refs.length) return []
      var ref = await refFor(path), dir = dirOf(path), have = {}
      var dirs = {}
      refs.forEach(function (rel) { dirs[dirOf(joinPath(dir, rel))] = 1 })
      await Promise.all(Object.keys(dirs).map(async function (d) {
        try {
          var list = await api('/repos/' + REPO + '/contents/' + enc(d) + '?ref=' + encodeURIComponent(ref))
          ;(Array.isArray(list) ? list : []).forEach(function (n) { have[n.path] = 1 })
        } catch (e) { if (e.status !== 404) throw e }
      }))
      return refs.filter(function (rel) {
        var file = joinPath(dir, rel)
        return !have[file] && !(pending && pending[file])
      }).sort()
    },
    /**
     * commit をきっかけに動いた Action（既定は下書き送信の draft.yml）の結果を待つ。
     * onUpdate({ state: 'waiting'|'running'|'success'|'failure'|'noperm'|'none', url, reason })
     */
    watchSend: async function (sha, onUpdate, workflow) {
      workflow = workflow || 'draft'
      var started = Date.now(), seen = false
      for (;;) {
        var runs
        try { runs = await api('/repos/' + REPO + '/actions/runs?head_sha=' + sha + '&per_page=10') }
        catch (e) {
          if (e.status === 403 || e.status === 404) return onUpdate({ state: 'noperm' })
          return onUpdate({ state: 'failure', reason: '結果を確認できませんでした（' + e.message + '）' })
        }
        var run = (runs.workflow_runs || []).filter(function (r) { return String(r.path || '').split('/').pop() === workflow + '.yml' })[0]
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
    describeSave: function (path) {
      var picked = isArticle(path) && refOverride[dirOf(path)]
      return isArticle(path) ? (picked && picked !== 'main' ? picked : draftBranch(path)) + ' ブランチに commit' : 'main に commit'
    },

    /** GitHub でこのファイルを開く URL（下書きブランチがあればそちら） */
    webUrl: async function (path) {
      var ref = await refFor(path)
      return 'https://github.com/' + REPO + '/blob/' + enc(ref) + '/' + enc(path)
    },

    /**
     * 記事を公開する：下書きブランチ（無ければ main）の記事フォルダを、main に1 commit で直接入れる。
     * expected は確認画面に出した本文（GitHub 上と違えば止める）、text は公開する本文（status: published 入り）。
     * 取り込むのはその記事のフォルダだけ。main 側でも変わっていたら止める。
     */
    publish: async function (path, expected, text) {
      var parts = path.split('/'), unit = unitOf(path)
      if (parts.length !== 3 || !unit.dir) throw new Error('公開できるのは dev/<名前>/<名前>.md か blog/<名前>/<名前>.md の記事だけです（📁 で移動してください）')
      text = text.replace(/\r\n/g, '\n')
      if (!/^---\n/.test(text) || !/^status: published$/m.test(text.split('\n---')[0])) throw new Error('frontmatter の status を published にできませんでした')
      var b = draftBranch(path), hasDraft = (await draftBranches(true)).indexOf(b) >= 0
      var mainHead = (await api('/repos/' + REPO + '/git/ref/heads/main')).object.sha
      var main = shaMap(await entriesUnder(mainHead, unit)), draft = main, base = main
      if (hasDraft) {
        var head = (await api('/repos/' + REPO + '/git/ref/heads/' + enc(b))).object.sha
        var cmp = await api('/repos/' + REPO + '/compare/' + mainHead + '...' + head)
        draft = shaMap(await entriesUnder(head, unit))
        base = shaMap(await entriesUnder(cmp.merge_base_commit.sha, unit))
      }
      if (!draft[path]) throw new Error('GitHub 上にこの記事が見つかりませんでした')
      var blob = await api('/repos/' + REPO + '/git/blobs/' + draft[path].sha)
      if (b64decode(blob.content).replace(/\r\n/g, '\n') !== expected) throw new Error('開いたあとに GitHub 上の記事が変わっています（↻ で読み直して、確認してから公開してください）')
      var changes = {}, all = Object.assign({}, main, draft)
      Object.keys(all).forEach(function (p) {
        var m = (main[p] || {}).sha, d = (draft[p] || {}).sha, o = (base[p] || {}).sha
        if (m === d) return
        if (m === o) changes[p] = d ? { mode: draft[p].mode, sha: d } : { mode: main[p].mode, sha: null }
        else if (d !== o || p === path) throw new Error('main の方でも変わっています：' + p + '（どちらを残すか、GitHub で確認してください）')
      })
      var made = await api('/repos/' + REPO + '/git/blobs', { method: 'POST', body: JSON.stringify({ content: b64encode(text), encoding: 'base64' }) })
      if (made.sha !== (main[path] || {}).sha) changes[path] = { mode: draft[path].mode, sha: made.sha }
      if (!Object.keys(changes).length) throw new Error('同じ内容がもう公開の状態で main に入っています。前回の送信が失敗していたら、GitHub の Actions から「Re-run」してください')
      var sha = await commitTree('main', changes, 'publish: ' + parts[1] + '（エディタから）', mainHead)
      return { sha: sha, files: Object.keys(changes).length }
    },

    /**
     * 記事を消す。dev/<slug>/<slug>.md ならフォルダ（画像ごと）、それ以外は .md だけ。
     * main から消す commit を作り、フォルダごとの記事なら下書きブランチも消す。
     * 返り値：何をしたかの一覧（[{ where, detail }]）
     */
    remove: async function (path) {
      var unit = unitOf(path), done = []
      var main = await entriesUnder('main', unit)
      if (main.length) {
        var ch = {}; main.forEach(function (n) { ch[n.path] = { mode: n.mode, sha: null } })
        var sha = await commitTree('main', ch, 'remove: ' + unit.path + '（エディタから）')
        done.push({ where: 'main', detail: main.length + ' ファイルを削除（commit ' + sha.slice(0, 7) + '）' })
      }
      var b = draftBranch(path)
      if ((await draftBranches(true)).indexOf(b) >= 0) {
        if (unit.dir) {
          await api('/repos/' + REPO + '/git/refs/heads/' + enc(b), { method: 'DELETE' })
          branchCache = (branchCache || []).filter(function (x) { return x !== b })
          done.push({ where: b, detail: '下書きブランチを削除' })
        } else {
          var onDraft = await entriesUnder(b, unit)
          if (onDraft.length) {
            var ch2 = {}; onDraft.forEach(function (n) { ch2[n.path] = { mode: n.mode, sha: null } })
            await commitTree(b, ch2, 'remove: ' + unit.path + '（エディタから）')
            done.push({ where: b, detail: '下書きブランチからも削除' })
          }
        }
      }
      if (!done.length) throw new Error('GitHub 上にこの記事が見つかりませんでした')
      return done
    },

    /**
     * 記事を別のフォルダ（例：dev / blog / blog/_fin / dev/_archived）へ移す。
     * まとまりの決め方は remove と同じ。main と下書きブランチの両方で移す。
     * 返り値：{ path: 移したあとの .md のパス, done: [...] }
     */
    move: async function (path, destDir) {
      destDir = String(destDir || '').replace(/^\/+|\/+$/g, '')
      if (!/^(dev|blog)(\/[^/]+)*$/.test(destDir) || destDir.indexOf('..') >= 0) throw new Error('移動先は dev か blog の中を選んでください')
      var unit = unitOf(path), base = unit.path.split('/').pop(), newUnit = destDir + '/' + base
      // 1枚の .md を dev/・blog/ の直下へ移すときは、公開できる形（<slug>/<slug>.md）にする
      if (!unit.dir && /^(dev|blog)$/.test(destDir)) newUnit = destDir + '/' + base.replace(/\.md$/, '') + '/' + base
      if (newUnit === unit.path) throw new Error('いまと同じ場所です')
      var newPath = unit.dir ? newUnit + '/' + path.split('/').pop() : newUnit
      var oldBranch = draftBranch(path), newBranch = draftBranch(newPath), done = []
      var branches = ['main'].concat((await draftBranches(true)).indexOf(oldBranch) >= 0 ? [oldBranch] : [])
      for (var i = 0; i < branches.length; i++) {
        var br = branches[i], list = await entriesUnder(br, unit)
        if (!list.length) continue
        var clash = await entriesUnder(br, { dir: unit.dir, path: newUnit })
        if (clash.length) throw new Error('移動先に同じ名前のものがあります：' + newUnit + '（' + br + '）')
        var ch = {}
        list.forEach(function (n) {
          ch[n.path] = { mode: n.mode, sha: null }
          ch[newUnit + n.path.slice(unit.path.length)] = { mode: n.mode, sha: n.sha }
        })
        var sha = await commitTree(br, ch, 'move: ' + unit.path + ' → ' + newUnit + '（エディタから）')
        done.push({ where: br, detail: list.length + ' ファイルを移動（commit ' + sha.slice(0, 7) + '）' })
        // 下書きブランチの名前はフォルダ名から決まる。変わるなら付け替える
        if (br !== 'main' && newBranch !== oldBranch) {
          await api('/repos/' + REPO + '/git/refs', { method: 'POST', body: JSON.stringify({ ref: 'refs/heads/' + newBranch, sha: sha }) })
          await api('/repos/' + REPO + '/git/refs/heads/' + enc(oldBranch), { method: 'DELETE' })
          branchCache = null
          done.push({ where: newBranch, detail: '下書きブランチの名前を ' + oldBranch + ' から変更' })
        }
      }
      if (!done.length) throw new Error('GitHub 上にこの記事が見つかりませんでした')
      return { path: newPath, done: done }
    },
  }

  /** 記事の「まとまり」：dev/<slug>/<slug>.md はフォルダごと（画像も一緒）、それ以外は .md だけ */
  function unitOf(path) {
    var parts = path.split('/'), file = parts[parts.length - 1].replace(/\.md$/, ''), folder = parts[parts.length - 2]
    if (parts.length >= 3 && folder === file && folder[0] !== '_') return { dir: true, path: parts.slice(0, -1).join('/') }
    return { dir: false, path: path }
  }
  /** ブランチの中で、まとまりに入るファイル（blob）の一覧 */
  async function entriesUnder(branch, unit) {
    var t = await api('/repos/' + REPO + '/git/trees/' + enc(branch) + '?recursive=1')
    if (t.truncated) throw new Error('リポジトリが大きすぎて一覧を取り切れませんでした')
    return t.tree.filter(function (n) { return n.type === 'blob' && (unit.dir ? n.path.indexOf(unit.path + '/') === 0 : n.path === unit.path) })
  }
  function shaMap(entries) { var map = {}; entries.forEach(function (n) { map[n.path] = { mode: n.mode, sha: n.sha } }); return map }
  /** changes（パス → { mode, sha }。sha が null なら削除）を1つの commit にしてブランチを進める。expectHead を渡すと、先頭が違えば止める */
  async function commitTree(branch, changes, message, expectHead) {
    var ref = await api('/repos/' + REPO + '/git/ref/heads/' + enc(branch))
    var head = ref.object.sha
    if (expectHead && head !== expectHead) throw new Error(branch + ' が先に更新されました。もう一度やり直してください')
    var parent = await api('/repos/' + REPO + '/git/commits/' + head)
    var tree = await api('/repos/' + REPO + '/git/trees', { method: 'POST', body: JSON.stringify({
      base_tree: parent.tree.sha,
      tree: Object.keys(changes).map(function (p) { return { path: p, mode: changes[p].mode || '100644', type: 'blob', sha: changes[p].sha } }),
    }) })
    var c = await api('/repos/' + REPO + '/git/commits', { method: 'POST', body: JSON.stringify({ message: message, tree: tree.sha, parents: [head] }) })
    await api('/repos/' + REPO + '/git/refs/heads/' + enc(branch), { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) })
    Object.keys(shaCache).forEach(function (k) { if (k.indexOf(branch + ':') === 0) delete shaCache[k] })
    return c.sha
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
  global.NoeStore.unitOf = unitOf
})(window)
