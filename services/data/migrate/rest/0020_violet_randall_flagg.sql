DO $$ BEGIN
 CREATE TYPE "sharesusersstate" AS ENUM('pending', 'accepted', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "shares_users" ADD COLUMN "state" "sharesusersstate" DEFAULT 'pending' NOT NULL;