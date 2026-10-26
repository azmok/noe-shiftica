#!/usr/bin/env tsx
/**
 * migrate-over-https.ts — Payload のマイグレーションを Neon の HTTPS ドライバで流す。
 *
 * `pnpm db:migrate` は Postgres の通常の接続（ポート 5432）を使う。Claude Code のクラウド環境
 * のように HTTPS（443）しか外に出られない場所では、こちらを使う。
 *
 * やること（`payload migrate` と同じ結果になる）:
 *   1. src/migrations/index.ts の一覧と payload_migrations を比べて、未適用のものを探す
 *   2. 各マイグレーションの up() を「SQL を記録するだけの db」で実行して、SQL を集める
 *   3. 集めた SQL を1文ずつに分け、payload_migrations への記録と一緒に
 *      1つのトランザクションで流す（どれかが失敗したら全部取り消される）
 *
 * 前提: マイグレーションは `db.execute(sql\`...\`)` だけを使うこと（結果を読む処理や
 * payload / req を使う処理は、ここでは実行できないのでエラーで止める）。
 *
 * 使い方（DATABASE_URL は .env か環境変数）:
 *   pnpm db:migrate:https            未適用のマイグレーションを流す
 *   pnpm db:migrate:https --status   適用状況を表示するだけ
 *   pnpm db:migrate:https --dry-run  流す SQL を表示するだけ（DB は変更しない）
 *   pnpm db:migrate:https --show <name>  指定したマイグレーションの SQL を表示する（DB に接続しない）
 */

import 'dotenv/config'
import { createRequire } from 'node:module'
import { realpathSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { migrations } from '../src/migrations'
import { splitSqlStatements } from './lib/splitSqlStatements'

interface CompiledQuery {
  sql: string
  params: unknown[]
}

const args = new Set(process.argv.slice(2))
const statusOnly = args.has('--status')
const dryRun = args.has('--dry-run')
const showIndex = process.argv.indexOf('--show')
const showName = showIndex === -1 ? undefined : process.argv[showIndex + 1]

/** Payload が使っているのと同じ drizzle-orm の PgDialect（sql`...` を SQL 文字列に直すため） */
async function loadPgDialect() {
  const dbPostgresDir = realpathSync(path.resolve('node_modules/@payloadcms/db-postgres'))
  const requireFromAdapter = createRequire(path.join(dbPostgresDir, 'package.json'))
  const pgCore = await import(pathToFileURL(requireFromAdapter.resolve('drizzle-orm/pg-core')).href)
  return new pgCore.PgDialect()
}

/** up() に渡す db。execute() の SQL を記録するだけで、ほかの操作はエラーにする */
function recordingDb(dialect: { sqlToQuery: (q: unknown) => CompiledQuery }, out: CompiledQuery[]) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'execute') {
          return async (query: unknown) => {
            out.push(dialect.sqlToQuery(query))
            return { rows: [], rowCount: 0 }
          }
        }
        if (prop === 'then') return undefined
        throw new Error(`db.${String(prop)} はこのスクリプトでは使えません（db.execute(sql\`...\`) だけ対応）`)
      },
    },
  )
}

const unsupported = (name: string) =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return undefined
        throw new Error(`${name}.${String(prop)} はこのスクリプトでは使えません。pnpm db:migrate を使ってください`)
      },
    },
  )

/** マイグレーションの up() を実行して、流す SQL（1文ずつ）を返す */
async function collectStatements(
  dialect: { sqlToQuery: (q: unknown) => CompiledQuery },
  migration: (typeof migrations)[number],
): Promise<CompiledQuery[]> {
  const recorded: CompiledQuery[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migration.up({ db: recordingDb(dialect, recorded), payload: unsupported('payload'), req: unsupported('req') } as any)
  // パラメーター付きの文は分けずにそのまま送る（1文として書かれている前提）
  return recorded.flatMap((q) => (q.params.length ? [q] : splitSqlStatements(q.sql).map((s) => ({ sql: s, params: [] }))))
}

async function main() {
  if (showName !== undefined) {
    const migration = migrations.find((m) => m.name === showName)
    if (!migration) throw new Error(`マイグレーションが見つかりません: ${showName}`)
    const statements = await collectStatements(await loadPgDialect(), migration)
    for (const s of statements) console.log(`${s.sql};${s.params.length ? `  -- params: ${JSON.stringify(s.params)}` : ''}`)
    console.log(`\n-- ${statements.length} 文`)
    return
  }

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL が設定されていません')
  const sql = neon(url)

  const appliedRows = (await sql('SELECT name, batch FROM payload_migrations ORDER BY id', [])) as Array<{
    name: string
    batch: string | number
  }>
  const applied = new Map(appliedRows.map((r) => [r.name, Number(r.batch)]))
  const pending = migrations.filter((m) => !applied.has(m.name))

  if (statusOnly) {
    for (const m of migrations) {
      const batch = applied.get(m.name)
      console.log(`${batch === undefined ? '  未適用' : `  batch ${batch}`}  ${m.name}`)
    }
    console.log(`\n未適用: ${pending.length} 件`)
    return
  }

  if (pending.length === 0) {
    console.log('未適用のマイグレーションはありません')
    return
  }

  const dialect = await loadPgDialect()
  const batch = Math.max(0, ...applied.values()) + 1
  const plan: Array<{ name: string; statements: CompiledQuery[] }> = []

  for (const m of pending) {
    plan.push({ name: m.name, statements: await collectStatements(dialect, m) })
  }

  for (const { name, statements } of plan) {
    console.log(`\n== ${name}（${statements.length} 文）`)
    if (dryRun) for (const s of statements) console.log(`${s.sql};${s.params.length ? `  -- params: ${JSON.stringify(s.params)}` : ''}`)
  }
  if (dryRun) {
    console.log(`\n--dry-run のため実行していません（実行時は batch ${batch} として記録）`)
    return
  }

  await sql.transaction([
    ...plan.flatMap(({ name, statements }) => [
      ...statements.map((s) => sql(s.sql, s.params)),
      sql('INSERT INTO payload_migrations (name, batch, created_at, updated_at) VALUES ($1, $2, now(), now())', [
        name,
        batch,
      ]),
    ]),
  ])
  console.log(`\n完了: ${plan.length} 件を batch ${batch} として適用しました`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
