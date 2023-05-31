ALTER TABLE "users" ADD COLUMN "premium" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "stripe_id" varchar;
CREATE UNIQUE INDEX IF NOT EXISTS "ix_users_stripe_id" ON "users" ("stripe_id");