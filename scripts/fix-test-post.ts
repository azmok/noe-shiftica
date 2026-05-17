import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fixPost() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`UPDATE posts SET published_at = NOW() WHERE slug = 'test' AND published_at IS NULL`;
  console.log("Fixed 'test' post published_at date!");
}

fixPost().catch(console.error);
