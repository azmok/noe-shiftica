import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkDb() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id, title, slug, _status, published_at, updated_at 
    FROM posts 
    WHERE slug IN ('test', 'asset-type-thinking-skill-assets-life-boost')
  `;
  console.log("Neon DB Specific Posts:");
  console.table(rows);
}

checkDb().catch(console.error);
