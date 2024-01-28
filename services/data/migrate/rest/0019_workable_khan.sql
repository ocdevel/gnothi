ALTER TABLE "shares" DROP COLUMN IF EXISTS "email";
ALTER TABLE "shares" RENAME COLUMN "email_visible" TO "email";--> statement-breakpoint
