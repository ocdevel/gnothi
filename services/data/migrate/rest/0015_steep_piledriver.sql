ALTER TABLE "users" ADD COLUMN "daily_all" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "todo_all" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_all" boolean DEFAULT true;