import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Dev の記事（tech-posts）にカスタム CSS / JS の列を追加する（customAssets プラグイン）。
 *
 * General（posts）の custom_css / custom_js は以前からある。dev で push 済みの環境でも
 * 失敗しないよう、冪等（IF NOT EXISTS / IF EXISTS）にしてある。
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "tech_posts" ADD COLUMN IF NOT EXISTS "custom_css" varchar;
  ALTER TABLE "tech_posts" ADD COLUMN IF NOT EXISTS "custom_js" varchar;
  ALTER TABLE "_tech_posts_v" ADD COLUMN IF NOT EXISTS "version_custom_css" varchar;
  ALTER TABLE "_tech_posts_v" ADD COLUMN IF NOT EXISTS "version_custom_js" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "tech_posts" DROP COLUMN IF EXISTS "custom_css";
  ALTER TABLE "tech_posts" DROP COLUMN IF EXISTS "custom_js";
  ALTER TABLE "_tech_posts_v" DROP COLUMN IF EXISTS "version_custom_css";
  ALTER TABLE "_tech_posts_v" DROP COLUMN IF EXISTS "version_custom_js";`)
}
