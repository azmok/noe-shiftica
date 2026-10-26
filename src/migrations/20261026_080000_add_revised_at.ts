import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * 記事の「更新日」（revisedAt）の列を追加する（revisedDate プラグイン）。
 *
 * General（posts）と Dev（tech-posts）の両方と、それぞれのバージョンテーブル。
 * dev で push 済みの環境でも失敗しないよう、冪等（IF NOT EXISTS / IF EXISTS）にしてある。
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "revised_at" timestamp(3) with time zone;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_revised_at" timestamp(3) with time zone;
  ALTER TABLE "tech_posts" ADD COLUMN IF NOT EXISTS "revised_at" timestamp(3) with time zone;
  ALTER TABLE "_tech_posts_v" ADD COLUMN IF NOT EXISTS "version_revised_at" timestamp(3) with time zone;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "posts" DROP COLUMN IF EXISTS "revised_at";
  ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_revised_at";
  ALTER TABLE "tech_posts" DROP COLUMN IF EXISTS "revised_at";
  ALTER TABLE "_tech_posts_v" DROP COLUMN IF EXISTS "version_revised_at";`)
}
