#!/usr/bin/env node
/**
 * publish-article.mjs — 記事フォルダ（.md + 画像）を /api/ai/posts に送る薄いクライアント（依存なし・Node 20+）。
 *
 * 前処理（<link>/<h1>/コメント/X の script の除去）・画像の media アップロードと埋め込み・
 * Lexical 変換・権限チェック・ApiLogs への記録は、すべてサーバー側（/api/ai/posts）が行う。
 * このスクリプトは .md と、本文が参照している画像ファイルを読んで JSON で送るだけ。
 *
 * 認証: 環境変数 NOE_PAYLOAD_API_KEY（管理画面 → 設定 → 外部AI連携 で発行したキー）
 *       NOE_PAYLOAD_URL（省略時 https://noe-shiftica.com）
 *
 * 下書き作成（同じ slug があれば下書きとして上書き更新）:
 *   node scripts/publish-article.mjs draft <article.md> \
 *     [--collection tech-posts] [--images <dir>] [--categories "22,ナレッジ"] [--tags "a,b"]
 *     [--hero <画像ファイル | media ID>] [--render markdown] [--status draft|published] [--dry-run]
 *   --hero: Hero 画像。ファイル名は記事フォルダ（--images）からの相対で、本文に無い画像でもよい
 *   --render markdown: 本文を Lexical ではなく Markdown 原文のまま表示するモードで送る
 *     （ai-box の中の画像や <img src="./…"> もアップロードする。noe-posts の記事はこれを使う）
 *   --status published: 下書きを経由せず、この本文のまま公開する（既定は draft）
 *
 * 公開（最新の下書きをそのまま公開）:
 *   node scripts/publish-article.mjs publish <slug> [--collection tech-posts]
 */

import fs from 'node:fs'
import path from 'node:path'

const BASE = (process.env.NOE_PAYLOAD_URL || 'https://noe-shiftica.com').replace(/\/$/, '')

function parseArgs(argv) {
  const [command, target, ...rest] = argv
  const opts = { collection: 'tech-posts', dryRun: false }
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--dry-run') opts.dryRun = true
    else if (a.startsWith('--')) opts[a.slice(2)] = rest[++i]
  }
  return { command, target, opts }
}

const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])

/** 本文が参照している画像ファイル名（独立行の `![alt](./file)`、コードフェンス内は除く） */
export function referencedImages(markdown) {
  const files = []
  let inFence = false
  for (const line of markdown.split('\n')) {
    const t = line.trim()
    if (/^```/.test(t)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = t.match(/^!\[[^\]]*\]\(([^)\s]+)\)$/)
    if (m) {
      let src = m[1]
      try {
        src = decodeURI(src)
      } catch {
        // keep as written
      }
      files.push(src.replace(/^\.\//, ''))
    }
  }
  return [...new Set(files)]
}

/** 本文中の相対パス画像すべて（--render markdown 用。サーバー側 referencedMarkdownImages と同じ規則） */
export function referencedImagesAll(markdown) {
  const files = new Set()
  let inFence = false
  const add = (raw) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|#|data:)/i.test(raw)) return
    if (/(^|\/)_assets\//.test(raw)) return
    let src = raw
    try {
      src = decodeURI(raw)
    } catch {
      // keep as written
    }
    if (/\.(png|jpe?g|gif|webp)$/i.test(src)) files.add(src.replace(/^\.\//, ''))
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

async function send(body) {
  const key = process.env.NOE_PAYLOAD_API_KEY
  if (!key) throw new Error('NOE_PAYLOAD_API_KEY が設定されていません。')
  const res = await fetch(`${BASE}/api/ai/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status}: ${json.error ?? 'unknown error'}${json.details ? ` (${json.details})` : ''}`)
  return json
}

async function draft(mdPath, opts) {
  const markdown = fs.readFileSync(mdPath, 'utf8')
  const dir = opts.images || path.dirname(mdPath)
  const refs = opts.render === 'markdown' ? referencedImagesAll(markdown) : referencedImages(markdown)
  const images = refs.map((src) => {
    const file = path.join(dir, src)
    if (!fs.existsSync(file)) throw new Error(`画像が見つかりません: ${file}`)
    return { filename: path.basename(src), data: fs.readFileSync(file).toString('base64') }
  })

  // --hero はファイル名か media ID。ファイルなら（本文で参照済みでなければ）images に足して送る
  let heroImage
  if (opts.hero) {
    if (/^\d+$/.test(opts.hero)) heroImage = Number(opts.hero)
    else {
      const file = path.join(dir, opts.hero)
      if (!fs.existsSync(file)) throw new Error(`Hero 画像が見つかりません: ${file}`)
      heroImage = path.basename(opts.hero)
      if (!images.some((i) => i.filename === heroImage)) {
        images.push({ filename: heroImage, data: fs.readFileSync(file).toString('base64') })
      }
    }
  }

  const body = {
    collection: opts.collection,
    markdown,
    images,
    status: opts.status === 'published' ? 'published' : 'draft',
    ...(opts.render ? { renderMode: opts.render } : {}),
    ...(opts.categories ? { categories: list(opts.categories) } : {}),
    ...(opts.tags ? { tags: list(opts.tags) } : {}),
    ...(heroImage !== undefined ? { heroImage } : {}),
  }

  if (opts.dryRun) {
    console.log(
      JSON.stringify(
        {
          endpoint: `${BASE}/api/ai/posts`,
          collection: body.collection,
          status: body.status,
          renderMode: body.renderMode,
          images: images.map((i) => `${i.filename} (${Math.round((i.data.length * 3) / 4 / 1024)} KB)`),
          categories: body.categories,
          tags: body.tags,
          heroImage: body.heroImage,
        },
        null,
        2,
      ),
    )
    return
  }

  const res = await send(body)
  const published = body.status === 'published'
  console.log(`${published ? '公開' : res.operation === 'create' ? '下書きを作成' : '下書きを更新'}しました: ${res.slug}`)
  if (res.heroImageId !== undefined) console.log(`  Hero 画像: media #${res.heroImageId}`)
  console.log(`  管理画面: ${BASE}${res.adminUrl}`)
  console.log(`  公開URL（公開後）: ${BASE}${res.url}`)
}

async function publish(slug, opts) {
  const res = await send({ collection: opts.collection, slug, status: 'published' })
  console.log(`公開しました: ${BASE}${res.url}`)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  const { command, target, opts } = parseArgs(process.argv.slice(2))
  const run = command === 'draft' ? draft : command === 'publish' ? publish : null
  if (!run || !target) {
    console.error('usage: publish-article.mjs draft <article.md> [options] | publish <slug> [options]')
    process.exit(1)
  }
  run(target, opts).catch((e) => {
    console.error(`✖ ${e.message}`)
    process.exit(1)
  })
}
