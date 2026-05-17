import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkDb() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT id, title, slug, _status, updated_at FROM posts ORDER BY updated_at DESC`;
  console.log("Neon DB Posts:");
  console.table(rows);
}

checkDb().catch(console.error);
