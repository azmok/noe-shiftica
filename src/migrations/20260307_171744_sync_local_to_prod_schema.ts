import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "_posts_v" (
    	"id" serial PRIMARY KEY NOT NULL,
    	"parent_id" integer,
    	"version_title" varchar,
    	"version_slug" varchar,
    	"version_author_id" integer,
    	"version_published_at" timestamp(3) with time zone,
    	"version_content" jsonb,
    	"version_cover_image_id" integer,
    	"version_hero_image_id" integer,
    	"version_updated_at" timestamp(3) with time zone,
    	"version_created_at" timestamp(3) with time zone,
    	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
    	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    	"latest" boolean
    );
    
    CREATE TABLE IF NOT EXISTS "_posts_v_rels" (
    	"id" serial PRIMARY KEY NOT NULL,
    	"order" integer,
    	"parent_id" integer NOT NULL,
    	"path" varchar NOT NULL,
    	"categories_id" integer
    );
    
    DO $$ BEGIN
      ALTER TABLE "posts" ALTER COLUMN "title" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "posts" ALTER COLUMN "slug" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

    -- Add columns manually with check to avoid errors if they already exist
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_url" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_width" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_height" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filesize" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filename" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_medium_url" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_medium_width" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_medium_height" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_medium_mime_type" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_medium_filesize" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_medium_filename" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_large_url" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_large_width" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_large_height" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_large_mime_type" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_large_filesize" numeric;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "media" ADD COLUMN "sizes_large_filename" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "posts" ADD COLUMN "_status" "enum_posts_status" DEFAULT 'draft';
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    
    DO $$ BEGIN
      ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_cover_image_idx" ON "_posts_v" USING btree ("version_cover_image_id");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_hero_image_idx" ON "_posts_v" USING btree ("version_hero_image_id");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
    CREATE INDEX IF NOT EXISTS "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
    CREATE INDEX IF NOT EXISTS "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "_posts_v_rels_categories_id_idx" ON "_posts_v_rels" USING btree ("categories_id");
    CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
    CREATE INDEX IF NOT EXISTS "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
    CREATE INDEX IF NOT EXISTS "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
    CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "posts__status_idx" ON "posts" USING btree ("_status");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "_posts_v_rels" CASCADE;
  DROP INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx";
  DROP INDEX "media_sizes_medium_sizes_medium_filename_idx";
  DROP INDEX "media_sizes_large_sizes_large_filename_idx";
  DROP INDEX "posts_slug_idx";
  DROP INDEX "posts__status_idx";
  ALTER TABLE "posts" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "content" SET NOT NULL;
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_url";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_width";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_height";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_url";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_width";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_height";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_large_url";
  ALTER TABLE "media" DROP COLUMN "sizes_large_width";
  ALTER TABLE "media" DROP COLUMN "sizes_large_height";
  ALTER TABLE "media" DROP COLUMN "sizes_large_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_large_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_large_filename";
  ALTER TABLE "posts" DROP COLUMN "_status";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";`)
}
