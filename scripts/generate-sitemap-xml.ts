import { config } from 'dotenv'
import path from 'path'
import { writeFileSync } from 'fs'

// Load environment variables (.env.local overrides .env)
config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
config({ path: path.resolve(process.cwd(), '.env'), override: false })

async function main() {
  // Import after env is loaded so payload picks up the DB connection string.
  const sitemap = (await import('../src/app/sitemap')).default
  const entries = await sitemap()

  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  // Mirror Next.js MetadataRoute.Sitemap XML serialization.
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  for (const e of entries as Array<{
    url: string
    lastModified?: string | Date
    changeFrequency?: string
    priority?: number
  }>) {
    lines.push('<url>')
    lines.push(`<loc>${esc(e.url)}</loc>`)
    if (e.lastModified) {
      const d = e.lastModified instanceof Date ? e.lastModified : new Date(e.lastModified)
      lines.push(`<lastmod>${d.toISOString()}</lastmod>`)
    }
    if (e.changeFrequency) lines.push(`<changefreq>${e.changeFrequency}</changefreq>`)
    if (typeof e.priority === 'number') lines.push(`<priority>${e.priority}</priority>`)
    lines.push('</url>')
  }
  lines.push('</urlset>')

  const xml = lines.join('\n') + '\n'
  const out = path.resolve(process.cwd(), 'sitemap.xml')
  writeFileSync(out, xml, 'utf-8')
  console.log(`Wrote ${entries.length} URLs to ${out}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
