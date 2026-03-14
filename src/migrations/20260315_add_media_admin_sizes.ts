import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add adminList image size columns
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_list_url" varchar; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_list_width" numeric; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_list_height" numeric; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_list_mime_type" varchar; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_list_filesize" numeric; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_list_filename" varchar; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)

  // Add adminPreview image size columns
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_preview_url" varchar; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_preview_width" numeric; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_preview_height" numeric; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_preview_mime_type" varchar; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_preview_filesize" numeric; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "sizes_admin_preview_filename" varchar; EXCEPTION WHEN duplicate_column THEN NULL; END $$`)

  // Add index for admin filename columns
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "media_sizes_admin_list_sizes_admin_list_filename_idx" ON "media" USING btree ("sizes_admin_list_filename")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "media_sizes_admin_preview_sizes_admin_preview_filename_idx" ON "media" USING btree ("sizes_admin_preview_filename")`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_list_url"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_list_width"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_list_height"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_list_mime_type"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_list_filesize"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_list_filename"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_preview_url"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_preview_width"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_preview_height"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_preview_mime_type"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_preview_filesize"`)
  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_admin_preview_filename"`)
}
