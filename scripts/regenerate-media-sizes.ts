/**
 * Regenerate every media document's size variants with the current Media.ts
 * imageSizes (WebP q85 / OG JPEG q85, introduced 2026-10).
 *
 * The original file is re-uploaded unchanged (same bytes, same filename); only the
 * derived sizes are rebuilt. Originals that were already shrunk by the old browser-side
 * 1 MB compression CANNOT be restored this way — those are listed as "re-upload
 * candidates" so they can be replaced from the source file.
 *
 * Usage (reads DATABASE_URL etc. from .env.local):
 *   pnpm exec tsx --env-file=.env.local scripts/regenerate-media-sizes.ts            # dry run
 *   pnpm exec tsx --env-file=.env.local scripts/regenerate-media-sizes.ts --apply    # write
 *   ... --apply --id=57                                                               # one doc
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Never let Payload's dev-mode schema push touch the (production) database.
process.env.PAYLOAD_MIGRATING = 'true'

const APPLY = process.argv.includes('--apply')
const ONLY_ID = process.argv.find((a) => a.startsWith('--id='))?.split('=')[1]

// Old rule: anything over 1 MB was squeezed to <= 0.9 MB in the browser. Originals that
// landed just under that ceiling were very likely downscaled/recompressed.
const SUSPECT_MIN = 0.6 * 1024 * 1024
const SUSPECT_MAX = 0.9 * 1024 * 1024

type SizeInfo = { filename?: string | null; mimeType?: string | null; filesize?: number | null }

function kb(bytes?: number | null): string {
  return bytes ? `${Math.round(bytes / 1024)}KB` : '-'
}

async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'media',
    limit: 0,
    depth: 0,
    overrideAccess: true,
    ...(ONLY_ID ? { where: { id: { equals: ONLY_ID } } } : {}),
  })

  const images = docs.filter((d) => typeof d.mimeType === 'string' && d.mimeType.startsWith('image/') && d.mimeType !== 'image/svg+xml')
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — ${images.length} image(s) of ${docs.length} media doc(s)\n`)

  let done = 0
  let failed = 0
  const suspects: string[] = []

  for (const doc of images) {
    const sizes = (doc.sizes ?? {}) as Record<string, SizeInfo>
    const before = Object.entries(sizes)
      .filter(([, s]) => s?.filename)
      .map(([name, s]) => `${name}:${(s.mimeType ?? '?').replace('image/', '')}/${kb(s.filesize)}`)
      .join(' ')
    const suspect =
      (doc.mimeType === 'image/jpeg' || doc.mimeType === 'image/png') &&
      (doc.filesize ?? 0) >= SUSPECT_MIN &&
      (doc.filesize ?? 0) <= SUSPECT_MAX
    if (suspect) suspects.push(`#${doc.id} ${doc.filename} (${doc.width}x${doc.height}, ${kb(doc.filesize)})`)

    console.log(`#${doc.id} ${doc.filename} ${doc.width}x${doc.height} ${kb(doc.filesize)}${suspect ? '  ⚠ re-upload candidate' : ''}`)
    console.log(`    before: ${before || '(no sizes)'}`)
    if (!APPLY) continue

    try {
      const res = await fetch(doc.url as string)
      if (!res.ok) throw new Error(`download ${res.status}`)
      const data = Buffer.from(await res.arrayBuffer())

      const updated = await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
        file: { data, mimetype: doc.mimeType as string, name: doc.filename as string, size: data.length },
        overwriteExistingFiles: true,
        overrideAccess: true,
        depth: 0,
      })
      const after = Object.entries((updated.sizes ?? {}) as Record<string, SizeInfo>)
        .filter(([, s]) => s?.filename)
        .map(([name, s]) => `${name}:${(s.mimeType ?? '?').replace('image/', '')}/${kb(s.filesize)}`)
        .join(' ')
      console.log(`    after:  ${after}`)
      done++
    } catch (error) {
      failed++
      console.error(`    FAILED: ${(error as Error).message}`)
    }
  }

  console.log(`\n${APPLY ? `regenerated ${done}, failed ${failed}` : 'dry run only — re-run with --apply to write'}`)
  if (suspects.length) {
    console.log(`\nRe-upload candidates (original likely shrunk by the old 1 MB browser compression):`)
    for (const s of suspects) console.log(`  ${s}`)
  }
  process.exit(failed ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
