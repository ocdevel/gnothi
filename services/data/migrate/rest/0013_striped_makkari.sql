UPDATE fields SET analyze_enabled = excluded_at IS NULL;
DROP INDEX IF EXISTS "ix_fields_excluded_at";--> statement-breakpoint
ALTER TABLE "fields" DROP COLUMN IF EXISTS "excluded_at";