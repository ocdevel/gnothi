ALTER TABLE "fields" RENAME COLUMN "value" TO "points";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "score" TO "points";--> statement-breakpoint
ALTER TABLE "fields" DROP COLUMN IF EXISTS "analyze_disabled_at";

UPDATE users SET points = 0;
UPDATE fields SET
    lane = 'custom',
    sort = 0,
    points = 0,
    analyze_enabled = true,
    score_enabled = false,
    score_total = 0,
    score_up_good = true,
    score_period = 0,
    streak = 0,
    reset_period = 'daily',
    reset_quota = 1,
    reset_every = 1,
    monday = true,
    tuesday = true,
    wednesday = true,
    thursday = true,
    friday = true,
    saturday = true,
    sunday = true,
    date_start = null,
    date_due = null,
    notes = null;