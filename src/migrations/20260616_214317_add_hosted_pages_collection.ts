import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "hosted_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar NOT NULL,
  	"html" varchar,
  	"css" varchar,
  	"js" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hosted_pages_id" integer;
  CREATE UNIQUE INDEX "hosted_pages_slug_idx" ON "hosted_pages" USING btree ("slug");
  CREATE INDEX "hosted_pages_updated_at_idx" ON "hosted_pages" USING btree ("updated_at");
  CREATE INDEX "hosted_pages_created_at_idx" ON "hosted_pages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hosted_pages_fk" FOREIGN KEY ("hosted_pages_id") REFERENCES "public"."hosted_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_hosted_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("hosted_pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hosted_pages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hosted_pages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hosted_pages_fk";
  
  DROP INDEX "payload_locked_documents_rels_hosted_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hosted_pages_id";`)
}
