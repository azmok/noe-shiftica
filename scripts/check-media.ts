import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkMedia() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const rows = await sql`SELECT * FROM media WHERE id = 40`;
    console.log("Neon DB Media Row (id: 40):");
    console.log(JSON.stringify(rows[0], null, 2));
  } catch (e: any) {
    console.error("Error querying media table:", e.message);
  }
}

checkMedia().catch(console.error);
