import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "custom_meta_data" jsonb;
  ALTER TABLE "_posts_v" ADD COLUMN "version_custom_meta_data" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "custom_meta_data";
  ALTER TABLE "_posts_v" DROP COLUMN "version_custom_meta_data";`)
}
