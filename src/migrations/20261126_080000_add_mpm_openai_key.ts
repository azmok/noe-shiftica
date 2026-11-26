import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "markdown_post_manager_settings"
      ADD COLUMN IF NOT EXISTS "openai_key_encrypted" varchar,
      ADD COLUMN IF NOT EXISTS "openai_key_hint" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "markdown_post_manager_settings"
      DROP COLUMN IF EXISTS "openai_key_encrypted",
      DROP COLUMN IF EXISTS "openai_key_hint";
  `)
}
