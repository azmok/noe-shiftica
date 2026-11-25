import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Markdown Post Manager の設定（global: markdown-post-manager-settings）のテーブルを作る。
 *   repo_url         記事の入り口にする GitHub リポジトリの URL
 *   token_encrypted  GitHub の鍵（PAYLOAD_SECRET 由来の鍵で AES-256-GCM 暗号化。API では返さない）
 *   token_hint       鍵の末尾4文字（「設定済み」の表示用）
 *
 * 新しいテーブルを作るだけで、既存のテーブル・データには触らない。冪等（IF NOT EXISTS）。
 * db.execute(sql`...`) だけなので `pnpm db:migrate:https` で流せる。本番にコードをマージする前に流すこと。
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "markdown_post_manager_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"repo_url" varchar,
  	"token_encrypted" varchar,
  	"token_hint" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "markdown_post_manager_settings";`)
}
