import { Client } from 'pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function checkDbData() {
    const dbUrl = process.env.DATABASE_URL
    const client = new Client({ connectionString: dbUrl })
    try {
        await client.connect()
        const res = await client.query('SELECT title, slug, _status FROM posts ORDER BY published_at DESC NULLS LAST LIMIT 15')
        console.log("SQL Titles:", res.rows.map(r => `[${r._status}] ${r.title}`).join('\n'))
    } finally {
        await client.end()
    }
}
checkDbData()
