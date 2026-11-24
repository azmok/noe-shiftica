import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * 記事に Markdown の「版の印」の列を追加する（markdownPostManager プラグインの上書きガード）。
 *   markdown_revision  markdownSource から計算する印（16桁の16進）。保存のたびに自動で入る
 *
 * posts / tech_posts と、そのバージョンテーブル（_posts_v / _tech_posts_v は version_ 接頭辞）。
 * db.execute(sql`...`) だけなので `pnpm db:migrate:https` で流せる。冪等（IF NOT EXISTS）。
 * 列を追加するだけで既存の列・データには触らない。本番にコードをマージする前に流すこと。
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "markdown_revision" varchar;
  ALTER TABLE "tech_posts" ADD COLUMN IF NOT EXISTS "markdown_revision" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_markdown_revision" varchar;
  ALTER TABLE "_tech_posts_v" ADD COLUMN IF NOT EXISTS "version_markdown_revision" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "posts" DROP COLUMN IF EXISTS "markdown_revision";
  ALTER TABLE "tech_posts" DROP COLUMN IF EXISTS "markdown_revision";
  ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_markdown_revision";
  ALTER TABLE "_tech_posts_v" DROP COLUMN IF EXISTS "version_markdown_revision";`)
}
