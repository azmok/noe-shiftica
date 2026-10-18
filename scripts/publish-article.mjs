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
 *     [--collection tech-posts] [--images <dir>] [--categories "22,ナレッジ"] [--tags "a,b"] [--dry-run]
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
  const images = referencedImages(markdown).map((src) => {
    const file = path.join(dir, src)
    if (!fs.existsSync(file)) throw new Error(`画像が見つかりません: ${file}`)
    return { filename: path.basename(src), data: fs.readFileSync(file).toString('base64') }
  })

  const body = {
    collection: opts.collection,
    markdown,
    images,
    status: 'draft',
    ...(opts.categories ? { categories: list(opts.categories) } : {}),
    ...(opts.tags ? { tags: list(opts.tags) } : {}),
  }

  if (opts.dryRun) {
    console.log(
      JSON.stringify(
        {
          endpoint: `${BASE}/api/ai/posts`,
          collection: body.collection,
          images: images.map((i) => `${i.filename} (${Math.round((i.data.length * 3) / 4 / 1024)} KB)`),
          categories: body.categories,
          tags: body.tags,
        },
        null,
        2,
      ),
    )
    return
  }

  const res = await send(body)
  console.log(`${res.operation === 'create' ? '下書きを作成' : '下書きを更新'}しました: ${res.slug}`)
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
