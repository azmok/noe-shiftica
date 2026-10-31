import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * 動画専用コレクション `videos` を追加する（videoUpload プラグイン）。
 *
 * db.execute(sql`...`) だけなので `pnpm db:migrate:https` で流せる。冪等（IF NOT EXISTS）。
 * 本番にコードをマージする前に流すこと。
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "videos_id" integer;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  CREATE INDEX IF NOT EXISTS "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "videos_filename_idx" ON "videos" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_videos_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_videos_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "videos_id";
  DROP TABLE IF EXISTS "videos" CASCADE;`)
}
