DO $$ BEGIN
 CREATE TYPE "aistate" AS ENUM('todo', 'skip', 'running', 'done');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "notetypes" ADD VALUE 'comment';
CREATE TABLE IF NOT EXISTS "shares_users" (
	"share_id" uuid NOT NULL,
	"obj_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shares_users" ADD CONSTRAINT "shares_users_share_id_obj_id" PRIMARY KEY("share_id","obj_id");

CREATE TABLE IF NOT EXISTS "ws_connections" (
	"connection_id" varchar PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL
);

DROP TABLE influencers;
DROP TABLE jobs;
DROP TABLE machines;
DROP TABLE model_hypers;
DROP TABLE profile_matches;
ALTER TABLE "entries" RENAME COLUMN "title_summary" TO "ai_title";
ALTER TABLE "entries" RENAME COLUMN "text_summary" TO "ai_text";
ALTER TABLE "entries" RENAME COLUMN "sentiment" TO "ai_sentiment";
ALTER TABLE "entries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "entries" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "field_entries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "field_entries" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "field_entries" ALTER COLUMN "field_id" SET NOT NULL;
ALTER TABLE "field_entries2" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "field_entries2" ALTER COLUMN "dupe" SET DEFAULT 0;
ALTER TABLE "fields" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "fields" ALTER COLUMN "type" SET DEFAULT 'fivestar';
ALTER TABLE "fields" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "fields" ALTER COLUMN "excluded_at" DROP DEFAULT;
ALTER TABLE "fields" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "notes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "notes" ALTER COLUMN "entry_id" SET NOT NULL;
ALTER TABLE "notes" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "notes" ALTER COLUMN "type" SET DEFAULT 'note';
ALTER TABLE "people" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "people" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "people" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "shares" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "shares" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "tags" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "tags" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(320);
ALTER TABLE "users" ALTER COLUMN "is_superuser" SET DEFAULT false;
ALTER TABLE "users" ALTER COLUMN "is_superuser" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "last_books" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "last_influencers" DROP DEFAULT;
ALTER TABLE "entries" ADD COLUMN "n_notes" integer DEFAULT 0;
ALTER TABLE "entries" ADD COLUMN "text_clean" varchar;
ALTER TABLE "entries" ADD COLUMN "text_paras" varchar[];
ALTER TABLE "entries" ADD COLUMN "ai_index_state" "aistate" DEFAULT 'todo';
ALTER TABLE "entries" ADD COLUMN "ai_summarize_state" "aistate" DEFAULT 'todo';
ALTER TABLE "entries" ADD COLUMN "ai_keywords" varchar[];
ALTER TABLE "tags" ADD COLUMN "sort" integer DEFAULT 0 NOT NULL;
ALTER TABLE "tags" ADD COLUMN "ai_index" boolean DEFAULT true;
ALTER TABLE "tags" ADD COLUMN "ai_summarize" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN "username" varchar;
ALTER TABLE "users" ADD COLUMN "n_tokens" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "affiliate" varchar;
ALTER TABLE "users" ADD COLUMN "accept_terms_conditions" timestamp;
ALTER TABLE "users" ADD COLUMN "accept_disclaimer" timestamp;
ALTER TABLE "users" ADD COLUMN "accept_privacy_policy" timestamp;
ALTER TABLE "entries" DROP COLUMN IF EXISTS "no_ai";
ALTER TABLE "entries" DROP COLUMN IF EXISTS "ai_ran";
ALTER TABLE "users" DROP COLUMN IF EXISTS "hashed_password";
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "users" DROP COLUMN IF EXISTS "paid";
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_verified";
DO $$ BEGIN
 ALTER TABLE "shares_users" ADD CONSTRAINT "shares_users_share_id_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "shares"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shares_users" ADD CONSTRAINT "shares_users_obj_id_users_id_fk" FOREIGN KEY ("obj_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ws_connections" ADD CONSTRAINT "ws_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "ix_ws_connections_user_id" ON "ws_connections" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_entries_ai_index_state" ON "entries" ("ai_index_state");
CREATE INDEX IF NOT EXISTS "ix_entries_ai_summarize_state" ON "entries" ("ai_summarize_state");
CREATE UNIQUE INDEX IF NOT EXISTS "ix_users_username" ON "users" ("username");
