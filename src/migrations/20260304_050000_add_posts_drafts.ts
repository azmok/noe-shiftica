import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version";
ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "autosave";
ALTER TABLE "_posts_v" ADD COLUMN "version_title" varchar;
ALTER TABLE "_posts_v" ADD COLUMN "version_slug" varchar;
ALTER TABLE "_posts_v" ADD COLUMN "version_author_id" integer;
ALTER TABLE "_posts_v" ADD COLUMN "version_published_at" timestamp(3) with time zone;
ALTER TABLE "_posts_v" ADD COLUMN "version_content" jsonb;
ALTER TABLE "_posts_v" ADD COLUMN "version_cover_image_id" integer;
ALTER TABLE "_posts_v" ADD COLUMN "version_hero_image_id" integer;
ALTER TABLE "_posts_v" ADD COLUMN "version_updated_at" timestamp(3) with time zone;
ALTER TABLE "_posts_v" ADD COLUMN "version_created_at" timestamp(3) with time zone;
ALTER TABLE "_posts_v" ADD COLUMN "version__status" "public"."enum__posts_v_version_status" DEFAULT 'draft';
ALTER TABLE "_posts_v" ADD COLUMN "latest" boolean;

ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_url" varchar;
ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_width" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_height" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filesize" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filename" varchar;
ALTER TABLE "media" ADD COLUMN "sizes_medium_url" varchar;
ALTER TABLE "media" ADD COLUMN "sizes_medium_width" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_medium_height" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_medium_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN "sizes_medium_filesize" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_medium_filename" varchar;
ALTER TABLE "media" ADD COLUMN "sizes_large_url" varchar;
ALTER TABLE "media" ADD COLUMN "sizes_large_width" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_large_height" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_large_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN "sizes_large_filesize" numeric;
ALTER TABLE "media" ADD COLUMN "sizes_large_filename" varchar;

ALTER TABLE "posts" DROP COLUMN IF EXISTS "slug_lock";

DROP INDEX IF EXISTS "_posts_v_autosave_idx";
CREATE INDEX IF NOT EXISTS "_posts_v_latest_idx" ON "_posts_v" ("latest");
CREATE INDEX IF NOT EXISTS "_posts_v_parent_idx" ON "_posts_v" ("parent_id");
CREATE INDEX IF NOT EXISTS "_posts_v_version_version__status_idx" ON "_posts_v" ("version__status");
CREATE INDEX IF NOT EXISTS "_posts_v_version_version_author_idx" ON "_posts_v" ("version_author_id");
CREATE INDEX IF NOT EXISTS "_posts_v_version_version_cover_image_idx" ON "_posts_v" ("version_cover_image_id");
CREATE INDEX IF NOT EXISTS "_posts_v_version_version_created_at_idx" ON "_posts_v" ("version_created_at");
CREATE INDEX IF NOT EXISTS "_posts_v_version_version_hero_image_idx" ON "_posts_v" ("version_hero_image_id");
CREATE INDEX IF NOT EXISTS "_posts_v_version_version_slug_idx" ON "_posts_v" ("version_slug");
CREATE INDEX IF NOT EXISTS "_posts_v_version_version_updated_at_idx" ON "_posts_v" ("version_updated_at");
CREATE INDEX IF NOT EXISTS "media_sizes_large_sizes_large_filename_idx" ON "media" ("sizes_large_filename");
CREATE INDEX IF NOT EXISTS "media_sizes_medium_sizes_medium_filename_idx" ON "media" ("sizes_medium_filename");
CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" ("sizes_thumbnail_filename");

DROP INDEX IF EXISTS "posts_slug_idx";
CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" ("slug");

ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_author_id_users_id_fk";
   ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_cover_image_id_media_id_fk";
   ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_hero_image_id_media_id_fk";
   
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_title";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_slug";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_author_id";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_published_at";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_content";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_cover_image_id";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_hero_image_id";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_updated_at";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_created_at";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version__status";
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "latest";
   
   ALTER TABLE "_posts_v" ADD COLUMN "version" jsonb;
   ALTER TABLE "_posts_v" ADD COLUMN "autosave" boolean;
   
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_url";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_width";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_height";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_mime_type";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_filesize";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_filename";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_url";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_width";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_height";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_mime_type";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_filesize";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_filename";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_url";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_width";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_height";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_mime_type";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_filesize";
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_filename";
   
   ALTER TABLE "posts" ADD COLUMN "slug_lock" boolean DEFAULT true;
   
   DROP INDEX IF EXISTS "_posts_v_latest_idx";
   DROP INDEX IF EXISTS "_posts_v_parent_idx";
   DROP INDEX IF EXISTS "_posts_v_version_version__status_idx";
   DROP INDEX IF EXISTS "_posts_v_version_version_author_idx";
   DROP INDEX IF EXISTS "_posts_v_version_version_cover_image_idx";
   DROP INDEX IF EXISTS "_posts_v_version_version_created_at_idx";
   DROP INDEX IF EXISTS "_posts_v_version_version_hero_image_idx";
   DROP INDEX IF EXISTS "_posts_v_version_version_slug_idx";
   DROP INDEX IF EXISTS "_posts_v_version_version_updated_at_idx";
   DROP INDEX IF EXISTS "media_sizes_large_sizes_large_filename_idx";
   DROP INDEX IF EXISTS "media_sizes_medium_sizes_medium_filename_idx";
   DROP INDEX IF EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx";
   
   CREATE INDEX IF NOT EXISTS "_posts_v_autosave_idx" ON "_posts_v" ("autosave");
   
   DROP INDEX IF EXISTS "posts_slug_idx";
   CREATE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" ("slug");
  `)
}
