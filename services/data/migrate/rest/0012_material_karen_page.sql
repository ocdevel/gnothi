ALTER TYPE "resetperiods" ADD VALUE 'never';--> statement-breakpoint
ALTER TABLE "fields" ALTER COLUMN "reset_period" SET DEFAULT 'daily';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_score_enabled" ON "fields" ("score_enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_analyze_enabled" ON "fields" ("analyze_enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_score_period" ON "fields" ("score_period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_reset_period" ON "fields" ("reset_period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_monday" ON "fields" ("monday");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_tuesday" ON "fields" ("tuesday");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_wednesday" ON "fields" ("wednesday");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_thursday" ON "fields" ("thursday");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_friday" ON "fields" ("friday");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_saturday" ON "fields" ("saturday");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_fields_sunday" ON "fields" ("sunday");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_users_timezone" ON "users" ("timezone");