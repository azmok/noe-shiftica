import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Standalone migration: Creates only the tech_posts tables and related structures.
 * All other schema changes (html_files, media sizes, etc.) were already applied
 * via Payload dev mode push and are NOT included here to avoid conflicts.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tech_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__tech_posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "tech_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"slug" varchar,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"content" jsonb,
  	"cover_image_id" integer,
  	"hero_image_id" integer,
  	"custom_meta_data" jsonb,
  	"html_embed_id" integer,
  	"og_image" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_tech_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "tech_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "_tech_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_slug" varchar,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_content" jsonb,
  	"version_cover_image_id" integer,
  	"version_hero_image_id" integer,
  	"version_custom_meta_data" jsonb,
  	"version_html_embed_id" integer,
  	"version_og_image" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__tech_posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_tech_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  -- Add tech_posts reference to locked documents (IF NOT EXISTS for safety)
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tech_posts_id" integer;

  -- Foreign keys for tech_posts
  ALTER TABLE "tech_posts" ADD CONSTRAINT "tech_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tech_posts" ADD CONSTRAINT "tech_posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tech_posts" ADD CONSTRAINT "tech_posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tech_posts" ADD CONSTRAINT "tech_posts_html_embed_id_html_files_id_fk" FOREIGN KEY ("html_embed_id") REFERENCES "public"."html_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tech_posts_rels" ADD CONSTRAINT "tech_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tech_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tech_posts_rels" ADD CONSTRAINT "tech_posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tech_posts_v" ADD CONSTRAINT "_tech_posts_v_parent_id_tech_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tech_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tech_posts_v" ADD CONSTRAINT "_tech_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tech_posts_v" ADD CONSTRAINT "_tech_posts_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tech_posts_v" ADD CONSTRAINT "_tech_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tech_posts_v" ADD CONSTRAINT "_tech_posts_v_version_html_embed_id_html_files_id_fk" FOREIGN KEY ("version_html_embed_id") REFERENCES "public"."html_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tech_posts_v_rels" ADD CONSTRAINT "_tech_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_tech_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tech_posts_v_rels" ADD CONSTRAINT "_tech_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;

  -- Indexes
  CREATE UNIQUE INDEX IF NOT EXISTS "tech_posts_slug_idx" ON "tech_posts" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "tech_posts_author_idx" ON "tech_posts" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "tech_posts_cover_image_idx" ON "tech_posts" USING btree ("cover_image_id");
  CREATE INDEX IF NOT EXISTS "tech_posts_hero_image_idx" ON "tech_posts" USING btree ("hero_image_id");
  CREATE INDEX IF NOT EXISTS "tech_posts_html_embed_idx" ON "tech_posts" USING btree ("html_embed_id");
  CREATE INDEX IF NOT EXISTS "tech_posts_updated_at_idx" ON "tech_posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tech_posts_created_at_idx" ON "tech_posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "tech_posts__status_idx" ON "tech_posts" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "tech_posts_rels_order_idx" ON "tech_posts_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "tech_posts_rels_parent_idx" ON "tech_posts_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "tech_posts_rels_path_idx" ON "tech_posts_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "tech_posts_rels_categories_id_idx" ON "tech_posts_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_parent_idx" ON "_tech_posts_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_version_version_slug_idx" ON "_tech_posts_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_version_version_author_idx" ON "_tech_posts_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_version_version_cover_image_idx" ON "_tech_posts_v" USING btree ("version_cover_image_id");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_version_version_hero_image_idx" ON "_tech_posts_v" USING btree ("version_hero_image_id");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_version_version_html_embed_idx" ON "_tech_posts_v" USING btree ("version_html_embed_id");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_version_version_updated_at_idx" ON "_tech_posts_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_version_version_created_at_idx" ON "_tech_posts_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_version_version__status_idx" ON "_tech_posts_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_created_at_idx" ON "_tech_posts_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_updated_at_idx" ON "_tech_posts_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_latest_idx" ON "_tech_posts_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_rels_order_idx" ON "_tech_posts_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_rels_parent_idx" ON "_tech_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_rels_path_idx" ON "_tech_posts_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_tech_posts_v_rels_categories_id_idx" ON "_tech_posts_v_rels" USING btree ("categories_id");
  
  -- Locked documents FK
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tech_posts_fk" FOREIGN KEY ("tech_posts_id") REFERENCES "public"."tech_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tech_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("tech_posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tech_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tech_posts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_tech_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_tech_posts_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "tech_posts" CASCADE;
  DROP TABLE IF EXISTS "tech_posts_rels" CASCADE;
  DROP TABLE IF EXISTS "_tech_posts_v" CASCADE;
  DROP TABLE IF EXISTS "_tech_posts_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tech_posts_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tech_posts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tech_posts_id";
  DROP TYPE IF EXISTS "public"."enum_tech_posts_status";
  DROP TYPE IF EXISTS "public"."enum__tech_posts_v_version_status";`)
}
