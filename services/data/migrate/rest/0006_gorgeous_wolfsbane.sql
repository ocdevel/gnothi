DO $$ BEGIN
 CREATE TYPE "shelves" AS ENUM('ai', 'cosine', 'like', 'already_read', 'dislike', 'remove', 'recommend');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP TABLE "auth_old";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "n_tokens" TO "credits";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "credits" SET DEFAULT 10;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "credits" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_credit" timestamp with time zone;
UPDATE users SET "credits"=10;