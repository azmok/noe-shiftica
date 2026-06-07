import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// ⚠️ DO NOT RUN THIS MIGRATION ⚠️
// Generated: 2026-06-07. Kept as a historical record only.
// All tables (passkeys, posts_slug_history, tech_posts_slug_history, _posts_v_version_slug_history,
// _tech_posts_v_version_slug_history) and the media.alt change were already applied to the
// production Neon DB via `payload dev push`. Running `up` will fail with "relation already exists".
// Running `down` will DROP CASCADE and destroy production data — ABSOLUTELY FORBIDDEN.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "posts_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar
  );
  
  CREATE TABLE "_posts_v_version_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "tech_posts_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar
  );
  
  CREATE TABLE "_tech_posts_v_version_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "passkeys" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"credential_i_d" varchar NOT NULL,
  	"public_key" varchar NOT NULL,
  	"counter" numeric DEFAULT 0 NOT NULL,
  	"transports" jsonb,
  	"device_label" varchar,
  	"device_type" varchar,
  	"backed_up" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "passkeys_id" integer;
  ALTER TABLE "posts_slug_history" ADD CONSTRAINT "posts_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_slug_history" ADD CONSTRAINT "_posts_v_version_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tech_posts_slug_history" ADD CONSTRAINT "tech_posts_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tech_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tech_posts_v_version_slug_history" ADD CONSTRAINT "_tech_posts_v_version_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tech_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_slug_history_order_idx" ON "posts_slug_history" USING btree ("_order");
  CREATE INDEX "posts_slug_history_parent_id_idx" ON "posts_slug_history" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_slug_history_order_idx" ON "_posts_v_version_slug_history" USING btree ("_order");
  CREATE INDEX "_posts_v_version_slug_history_parent_id_idx" ON "_posts_v_version_slug_history" USING btree ("_parent_id");
  CREATE INDEX "tech_posts_slug_history_order_idx" ON "tech_posts_slug_history" USING btree ("_order");
  CREATE INDEX "tech_posts_slug_history_parent_id_idx" ON "tech_posts_slug_history" USING btree ("_parent_id");
  CREATE INDEX "_tech_posts_v_version_slug_history_order_idx" ON "_tech_posts_v_version_slug_history" USING btree ("_order");
  CREATE INDEX "_tech_posts_v_version_slug_history_parent_id_idx" ON "_tech_posts_v_version_slug_history" USING btree ("_parent_id");
  CREATE INDEX "passkeys_user_idx" ON "passkeys" USING btree ("user_id");
  CREATE UNIQUE INDEX "passkeys_credential_i_d_idx" ON "passkeys" USING btree ("credential_i_d");
  CREATE INDEX "passkeys_updated_at_idx" ON "passkeys" USING btree ("updated_at");
  CREATE INDEX "passkeys_created_at_idx" ON "passkeys" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_passkeys_fk" FOREIGN KEY ("passkeys_id") REFERENCES "public"."passkeys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_passkeys_id_idx" ON "payload_locked_documents_rels" USING btree ("passkeys_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tech_posts_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_tech_posts_v_version_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "passkeys" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "posts_slug_history" CASCADE;
  DROP TABLE "_posts_v_version_slug_history" CASCADE;
  DROP TABLE "tech_posts_slug_history" CASCADE;
  DROP TABLE "_tech_posts_v_version_slug_history" CASCADE;
  DROP TABLE "passkeys" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_passkeys_fk";
  
  DROP INDEX "payload_locked_documents_rels_passkeys_id_idx";
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "passkeys_id";`)
}
