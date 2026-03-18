import { Client } from 'pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
async function checkDbConnection() {
    const dbUrl = process.env.DATABASE_URL
    console.log("Using DATABASE_URL starting with:", dbUrl ? dbUrl.substring(0, 20) : "UNDEFINED")

    if (!dbUrl) {
        console.error("No DATABASE_URL found in .env.local")
        process.exit(1)
    }

    const client = new Client({
        connectionString: dbUrl,
    })

    try {
        console.log("Attempting to connect...")
        await client.connect()
        console.log("✅ Connected to PostgreSQL successfully!")

        // Test a simple query
        const res = await client.query('SELECT NOW()')
        console.log("Current time from DB:", res.rows[0].now)

        // Check if the posts table exists
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        const tableNames = tables.rows.map(r => r.table_name)
        console.log(`Found ${tableNames.length} tables in public schema.`)
        console.log("Includes 'posts' table?", tableNames.includes('posts') ? "Yes" : "No")

        if (tableNames.includes('posts')) {
            const postsCount = await client.query("SELECT COUNT(*) FROM posts")
            console.log("Number of rows in posts table:", postsCount.rows[0].count)
        }

    } catch (e) {
        console.error("❌ Failed to connect to the database:", e)
    } finally {
        await client.end()
        process.exit(0)
    }
}

checkDbConnection()
