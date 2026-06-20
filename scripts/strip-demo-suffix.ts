import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
config({ path: path.resolve(process.cwd(), '.env'), override: false })

/**
 * Remove the redundant trailing "（デモ機能）" parenthetical — and the bare
 * trailing "デモ" on the passkey entry — from What's New titles / SEO titles.
 */
const strip = (s?: string | null) =>
  s ? s.replace(/（デモ機能）\s*$/u, '').replace(/デモ\s*$/u, '').trimEnd() : s

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../src/payload.config')
  const payload = await getPayload({ config: configPromise })

  const all = await payload.find({ collection: 'whats-new', limit: 1000, overrideAccess: true })
  let count = 0
  for (const doc of all.docs as any[]) {
    const newTitle = strip(doc.title)
    const newMetaTitle = strip(doc.seo?.metaTitle)
    const titleChanged = newTitle !== doc.title
    const metaChanged = newMetaTitle !== doc.seo?.metaTitle
    if (!titleChanged && !metaChanged) continue

    await payload.update({
      collection: 'whats-new',
      id: doc.id,
      data: {
        ...(titleChanged && newTitle != null ? { title: newTitle } : {}),
        ...(metaChanged ? { seo: { ...doc.seo, metaTitle: newMetaTitle } } : {}),
      },
      overrideAccess: true,
    })
    console.log(`✓ ${doc.slug}\n    title: "${doc.title}" -> "${newTitle}"`)
    count++
  }
  console.log(`\nDone. Updated ${count} entries.`)
  process.exit(0)
}

run().catch((err) => { console.error('Process failed:', err); process.exit(1) })
