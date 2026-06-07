import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })
  await client.connect()
  try {
    const res = await client.query('SELECT id, title, slug, author_id, cover_image_id, hero_image_id, html_embed_id FROM tech_posts')
    console.log('--- tech_posts ---')
    console.log(JSON.stringify(res.rows, null, 2))

    const rels = await client.query('SELECT * FROM tech_posts_rels')
    console.log('--- tech_posts_rels ---')
    console.log(JSON.stringify(rels.rows, null, 2))

    const categories = await client.query('SELECT id, name FROM categories')
    console.log('--- categories ---')
    console.log(JSON.stringify(categories.rows, null, 2))

    const htmlFiles = await client.query('SELECT id, filename FROM html_files')
    console.log('--- html_files ---')
    console.log(JSON.stringify(htmlFiles.rows, null, 2))

    const users = await client.query('SELECT id, email FROM users')
    console.log('--- users ---')
    console.log(JSON.stringify(users.rows, null, 2))

    const media = await client.query('SELECT id, filename FROM media')
    console.log('--- media ---')
    console.log(JSON.stringify(media.rows, null, 2))

  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}

main()
