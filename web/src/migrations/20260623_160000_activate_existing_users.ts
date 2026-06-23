import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// One-shot data fix: all users that existed before the invite-only flow was
// introduced have account_activated = false (the column default). They already
// have working passwords and need to be marked active so guardForgotPasswordActivation
// doesn't block their forgot-password requests.
//
// Safe to run because: (a) the invite system just launched, (b) no invite-created
// users exist in production yet (the admin was unavailable during the schema gap),
// so every account_activated = false row belongs to a pre-existing legitimate user.
//
// down: deliberately a no-op — reverting activated rows would lock out real users
// and cannot be done safely without knowing which rows were pre-invite vs. invited.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "users" SET "account_activated" = true
    WHERE "account_activated" = false OR "account_activated" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Intentionally empty — reverting activated accounts is not safe.
}
