CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payment_id" varchar,
	"created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "users" RENAME COLUMN "stripe_id" TO "payment_id";
DROP INDEX IF EXISTS "ix_users_stripe_id";
CREATE INDEX IF NOT EXISTS "ix_payments_user_id" ON "payments" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_payments_payment_id" ON "payments" ("payment_id");
CREATE INDEX IF NOT EXISTS "ix_payments_created_at" ON "payments" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_users_payment_id" ON "users" ("payment_id");
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
