import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "users" ADD COLUMN "account_activated" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "users" DROP COLUMN "account_activated";`)
}
