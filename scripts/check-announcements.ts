import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    try {
        const changelogs = await sql`SELECT * FROM changelog ORDER BY date DESC LIMIT 5`;
        console.log("Changelogs count:", changelogs.length);
        for (const c of changelogs) {
            console.log(`- Date: ${c.date}, Category: ${c.category}, Version: ${c.version}, Status: ${c.status}`);
            const changes = await sql`SELECT text FROM changelog_changes WHERE _parent_id = ${c.id} ORDER BY _order ASC`;
            changes.forEach(ch => console.log(`    * ${ch.text}`));
        }
    } catch (e) {
        console.error("Changelog query error:", e.message);
    }

    try {
        const whatsNews = await sql`SELECT * FROM whats_new ORDER BY created_at DESC LIMIT 5`;
        console.log("\nWhatsNew count:", whatsNews.length);
        for (const w of whatsNews) {
            console.log(`- Title: ${w.title}, Slug: ${w.slug}, Status: ${w.status}, Date: ${w.published_at || w.created_at}`);
        }
    } catch (e) {
        console.error("WhatsNew query error:", e.message);
    }
}

main().catch(console.error);
