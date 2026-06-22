import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "changes_requested_by_id" integer;
  ALTER TABLE "posts" ADD COLUMN "changes_requested_at" timestamp(3) with time zone;
  ALTER TABLE "_posts_v" ADD COLUMN "version_changes_requested_by_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_changes_requested_at" timestamp(3) with time zone;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_changes_requested_by_id_users_id_fk" FOREIGN KEY ("changes_requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_changes_requested_by_id_users_id_fk" FOREIGN KEY ("version_changes_requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_changes_requested_by_idx" ON "posts" USING btree ("changes_requested_by_id");
  CREATE INDEX "_posts_v_version_version_changes_requested_by_idx" ON "_posts_v" USING btree ("version_changes_requested_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP CONSTRAINT "posts_changes_requested_by_id_users_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_changes_requested_by_id_users_id_fk";
  
  DROP INDEX "posts_changes_requested_by_idx";
  DROP INDEX "_posts_v_version_version_changes_requested_by_idx";
  ALTER TABLE "posts" DROP COLUMN "changes_requested_by_id";
  ALTER TABLE "posts" DROP COLUMN "changes_requested_at";
  ALTER TABLE "_posts_v" DROP COLUMN "version_changes_requested_by_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_changes_requested_at";`)
}
