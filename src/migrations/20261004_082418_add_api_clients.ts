import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * 外部AI連携（api_clients）と AI API Logs（api_logs）を追加する。
 *
 * migrate:create の自動生成には whats_new / changelog / posts.custom_css などの
 * 既に本番に存在するテーブル・列も含まれていた（前回の snapshot が dev push 前のまま
 * だったため）。それらは除外し、今回の変更分だけを冪等（IF NOT EXISTS）に適用する。
 * api_logs は dev push で既に作られている環境もあるので同様に冪等にしてある。
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_api_logs_action" AS ENUM('post', 'delete');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_api_logs_status" AS ENUM('success', 'error');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  CREATE TABLE IF NOT EXISTS "api_clients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"note" varchar,
  	"enabled" boolean DEFAULT true,
  	"permission_summary" varchar,
  	"permissions_posts_read" boolean DEFAULT false,
  	"permissions_posts_create" boolean DEFAULT false,
  	"permissions_posts_update" boolean DEFAULT false,
  	"permissions_posts_delete" boolean DEFAULT false,
  	"permissions_posts_publish" boolean DEFAULT false,
  	"permissions_tech_posts_read" boolean DEFAULT false,
  	"permissions_tech_posts_create" boolean DEFAULT false,
  	"permissions_tech_posts_update" boolean DEFAULT false,
  	"permissions_tech_posts_delete" boolean DEFAULT false,
  	"permissions_tech_posts_publish" boolean DEFAULT false,
  	"permissions_hosted_pages_read" boolean DEFAULT false,
  	"permissions_hosted_pages_create" boolean DEFAULT false,
  	"permissions_hosted_pages_update" boolean DEFAULT false,
  	"permissions_hosted_pages_delete" boolean DEFAULT false,
  	"permissions_html_files_read" boolean DEFAULT false,
  	"permissions_html_files_create" boolean DEFAULT false,
  	"permissions_html_files_update" boolean DEFAULT false,
  	"permissions_html_files_delete" boolean DEFAULT false,
  	"permissions_media_read" boolean DEFAULT false,
  	"permissions_media_create" boolean DEFAULT false,
  	"permissions_media_update" boolean DEFAULT false,
  	"permissions_media_delete" boolean DEFAULT false,
  	"permissions_categories_read" boolean DEFAULT false,
  	"permissions_categories_create" boolean DEFAULT false,
  	"permissions_categories_update" boolean DEFAULT false,
  	"permissions_categories_delete" boolean DEFAULT false,
  	"permissions_changelog_read" boolean DEFAULT false,
  	"permissions_changelog_create" boolean DEFAULT false,
  	"permissions_changelog_update" boolean DEFAULT false,
  	"permissions_changelog_delete" boolean DEFAULT false,
  	"permissions_whats_new_read" boolean DEFAULT false,
  	"permissions_whats_new_create" boolean DEFAULT false,
  	"permissions_whats_new_update" boolean DEFAULT false,
  	"permissions_whats_new_delete" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar
  );

  CREATE TABLE IF NOT EXISTS "api_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum_api_logs_action" NOT NULL,
  	"status" "enum_api_logs_status" NOT NULL,
  	"response_status" numeric,
  	"post_title" varchar,
  	"post_slug" varchar,
  	"post_id" varchar,
  	"client_ip" varchar,
  	"request_summary" varchar,
  	"error_message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "api_logs" ADD COLUMN IF NOT EXISTS "client_id" integer;
  ALTER TABLE "api_logs" ADD COLUMN IF NOT EXISTS "client_name" varchar;

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "api_logs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "api_clients_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN IF NOT EXISTS "api_clients_id" integer;

  DO $$ BEGIN
    ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_client_id_api_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_api_logs_fk" FOREIGN KEY ("api_logs_id") REFERENCES "public"."api_logs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_api_clients_fk" FOREIGN KEY ("api_clients_id") REFERENCES "public"."api_clients"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_api_clients_fk" FOREIGN KEY ("api_clients_id") REFERENCES "public"."api_clients"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  CREATE INDEX IF NOT EXISTS "api_logs_client_idx" ON "api_logs" USING btree ("client_id");
  CREATE INDEX IF NOT EXISTS "api_logs_updated_at_idx" ON "api_logs" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "api_logs_created_at_idx" ON "api_logs" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "api_clients_updated_at_idx" ON "api_clients" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "api_clients_created_at_idx" ON "api_clients" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_api_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("api_logs_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_api_clients_id_idx" ON "payload_locked_documents_rels" USING btree ("api_clients_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_api_clients_id_idx" ON "payload_preferences_rels" USING btree ("api_clients_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_api_logs_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_api_clients_fk";
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT IF EXISTS "payload_preferences_rels_api_clients_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_api_logs_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_api_clients_id_idx";
  DROP INDEX IF EXISTS "payload_preferences_rels_api_clients_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "api_logs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "api_clients_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "api_clients_id";
  DROP TABLE IF EXISTS "api_logs" CASCADE;
  DROP TABLE IF EXISTS "api_clients" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_api_logs_action";
  DROP TYPE IF EXISTS "public"."enum_api_logs_status";`)
}
