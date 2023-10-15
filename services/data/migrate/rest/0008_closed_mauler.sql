DO $$ BEGIN
 CREATE TYPE "lanes" AS ENUM('habit', 'daily', 'todo', 'custom', 'reward');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "lane" "lanes" DEFAULT 'custom';