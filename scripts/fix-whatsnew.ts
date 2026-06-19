import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
config({ path: path.resolve(process.cwd(), '.env'), override: false })

/**
 * What's New corrections:
 *  1. Delete `swiss-style-blog-ui` — it's a front-end visual change, so it
 *     belongs in the Changelog (re-added there at its true 2026-04-03 date),
 *     not in the client-facing What's New feed.
 *  2. Publish the remaining draft plugin/feature demos so the plugins Azuma
 *     wants showcased are actually visible in What's New.
 */
const DELETE_SLUGS = ['swiss-style-blog-ui']
const PUBLISH_SLUGS = [
  'markdown-importer-slug-demo',
  'passkey-2fa-security-demo',
  'ai-content-optimizer-demo',
  'html-hosting-standalone-demo',
]

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../src/payload.config')
  const payload = await getPayload({ config: configPromise })

  for (const slug of DELETE_SLUGS) {
    const found = await payload.find({ collection: 'whats-new', where: { slug: { equals: slug } }, overrideAccess: true })
    for (const doc of found.docs) {
      await payload.delete({ collection: 'whats-new', id: doc.id, overrideAccess: true })
      console.log(`- Deleted What's New entry: "${doc.title}" (slug: ${slug}, ID: ${doc.id})`)
    }
  }

  for (const slug of PUBLISH_SLUGS) {
    const found = await payload.find({ collection: 'whats-new', where: { slug: { equals: slug } }, overrideAccess: true })
    for (const doc of found.docs as any[]) {
      if (doc.status === 'published') {
        console.log(`= Already published: ${slug}`)
        continue
      }
      const updated = await payload.update({ collection: 'whats-new', id: doc.id, data: { status: 'published' }, overrideAccess: true })
      console.log(`✓ Published: "${updated.title}" (slug: ${slug}, ID: ${updated.id})`)
    }
  }

  console.log('\nWhat\'s New corrections complete.')
  process.exit(0)
}

run().catch((err) => { console.error('Fix process failed:', err); process.exit(1) })
