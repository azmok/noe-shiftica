import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * 記事に「Markdown そのまま表示」用の列を追加する（markdownRender プラグイン）。
 *   render_mode      'lexical'（既定）/ 'markdown'。既存記事はすべて 'lexical' のまま
 *   markdown_source  Markdown 原文（前処理済み）
 *   markdown_media   本文画像の対応表（ファイル名 → { id, url }）
 *
 * posts / tech_posts と、そのバージョンテーブル（_posts_v / _tech_posts_v は version_ 接頭辞）。
 * db.execute(sql`...`) だけなので `pnpm db:migrate:https` で流せる。冪等（IF NOT EXISTS）。
 * 列を追加するだけで既存の列・データには触らない。本番にコードをマージする前に流すこと。
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "render_mode" varchar DEFAULT 'lexical';
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "markdown_source" varchar;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "markdown_media" jsonb;
  ALTER TABLE "tech_posts" ADD COLUMN IF NOT EXISTS "render_mode" varchar DEFAULT 'lexical';
  ALTER TABLE "tech_posts" ADD COLUMN IF NOT EXISTS "markdown_source" varchar;
  ALTER TABLE "tech_posts" ADD COLUMN IF NOT EXISTS "markdown_media" jsonb;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_render_mode" varchar DEFAULT 'lexical';
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_markdown_source" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_markdown_media" jsonb;
  ALTER TABLE "_tech_posts_v" ADD COLUMN IF NOT EXISTS "version_render_mode" varchar DEFAULT 'lexical';
  ALTER TABLE "_tech_posts_v" ADD COLUMN IF NOT EXISTS "version_markdown_source" varchar;
  ALTER TABLE "_tech_posts_v" ADD COLUMN IF NOT EXISTS "version_markdown_media" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "posts" DROP COLUMN IF EXISTS "render_mode";
  ALTER TABLE "posts" DROP COLUMN IF EXISTS "markdown_source";
  ALTER TABLE "posts" DROP COLUMN IF EXISTS "markdown_media";
  ALTER TABLE "tech_posts" DROP COLUMN IF EXISTS "render_mode";
  ALTER TABLE "tech_posts" DROP COLUMN IF EXISTS "markdown_source";
  ALTER TABLE "tech_posts" DROP COLUMN IF EXISTS "markdown_media";
  ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_render_mode";
  ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_markdown_source";
  ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_markdown_media";
  ALTER TABLE "_tech_posts_v" DROP COLUMN IF EXISTS "version_render_mode";
  ALTER TABLE "_tech_posts_v" DROP COLUMN IF EXISTS "version_markdown_source";
  ALTER TABLE "_tech_posts_v" DROP COLUMN IF EXISTS "version_markdown_media";`)
}
