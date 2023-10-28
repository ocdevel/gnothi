DO $$ BEGIN
 CREATE TYPE "resetperiods" AS ENUM('daily', 'weekly', 'monthly', 'yearly', 'forever');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "analyze_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "analyze_disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "score_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "score_total" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "score_up_good" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "score_period" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "streak" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "reset_period" "resetperiods" DEFAULT 'forever';--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "reset_quota" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "reset_every" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "monday" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "tuesday" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "wednesday" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "thursday" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "friday" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "saturday" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "sunday" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "date_start" date;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "date_due" date;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "notes" varchar;