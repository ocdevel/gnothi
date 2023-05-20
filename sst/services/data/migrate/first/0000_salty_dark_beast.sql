CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

DO $$ BEGIN
 CREATE TYPE "defaultvaluetypes" AS ENUM('value', 'average', 'ffill');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "fieldtype" AS ENUM('number', 'fivestar', 'check', 'option');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "machinetypes" AS ENUM('gpu', 'server');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "notetypes" AS ENUM('label', 'note', 'resource');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "shelves" AS ENUM('ai', 'like', 'already_read', 'dislike', 'remove', 'recommend', 'cosine');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "books" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"text" varchar NOT NULL,
	"author" varchar,
	"topic" varchar,
	"thumbs" integer DEFAULT 0,
	"amazon" varchar
);

CREATE TABLE IF NOT EXISTS "bookshelf" (
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"book_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"shelf" shelves NOT NULL,
	"score" double precision
);
--> statement-breakpoint
ALTER TABLE "bookshelf" ADD CONSTRAINT "bookshelf_book_id_user_id" PRIMARY KEY("book_id","user_id");

CREATE TABLE IF NOT EXISTS "entries" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"title" varchar,
	"text" varchar NOT NULL,
	"no_ai" boolean DEFAULT false,
	"ai_ran" boolean DEFAULT false,
	"title_summary" varchar,
	"text_summary" varchar,
	"sentiment" varchar,
	"user_id" uuid
);

CREATE TABLE IF NOT EXISTS "entries_tags" (
	"entry_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries_tags" ADD CONSTRAINT "entries_tags_entry_id_tag_id" PRIMARY KEY("entry_id","tag_id");

CREATE TABLE IF NOT EXISTS "field_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"value" double precision,
	"created_at" timestamp with time zone DEFAULT now(),
	"user_id" uuid,
	"field_id" uuid
);

CREATE TABLE IF NOT EXISTS "field_entries2" (
	"field_id" uuid NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"value" double precision,
	"user_id" uuid,
	"dupes" jsonb,
	"dupe" integer
);
--> statement-breakpoint
ALTER TABLE "field_entries2" ADD CONSTRAINT "field_entries2_field_id_day" PRIMARY KEY("field_id","day");

CREATE TABLE IF NOT EXISTS "fields" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" fieldtype,
	"name" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"excluded_at" timestamp with time zone DEFAULT now(),
	"default_value" defaultvaluetypes DEFAULT 'value',
	"default_value_value" double precision,
	"attributes" json,
	"service" varchar,
	"service_id" varchar,
	"user_id" uuid,
	"influencer_score" double precision DEFAULT 0,
	"next_pred" double precision DEFAULT 0,
	"avg" double precision DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "influencers" (
	"field_id" uuid NOT NULL,
	"influencer_id" uuid NOT NULL,
	"score" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_field_id_influencer_id" PRIMARY KEY("field_id","influencer_id");

CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"method" varchar NOT NULL,
	"state" varchar DEFAULT 'new',
	"run_on" machinetypes DEFAULT 'gpu',
	"machine_id" varchar,
	"data_in" jsonb,
	"data_out" jsonb
);

CREATE TABLE IF NOT EXISTS "machines" (
	"id" varchar PRIMARY KEY NOT NULL,
	"status" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "model_hypers" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"model" varchar NOT NULL,
	"model_version" integer NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"score" double precision NOT NULL,
	"hypers" jsonb NOT NULL,
	"meta" jsonb
);

CREATE TABLE IF NOT EXISTS "notes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"entry_id" uuid,
	"user_id" uuid,
	"type" notetypes NOT NULL,
	"text" varchar NOT NULL,
	"private" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "people" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar,
	"relation" varchar,
	"issues" varchar,
	"bio" varchar,
	"user_id" uuid
);

CREATE TABLE IF NOT EXISTS "profile_matches" (
	"user_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"score" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_matches" ADD CONSTRAINT "profile_matches_user_id_match_id" PRIMARY KEY("user_id","match_id");

CREATE TABLE IF NOT EXISTS "shares" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"email" varchar(255),
	"fields" boolean,
	"books" boolean,
	"profile" boolean,
	"last_seen" timestamp with time zone DEFAULT now(),
	"new_entries" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "shares_tags" (
	"share_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"selected" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "shares_tags" ADD CONSTRAINT "shares_tags_share_id_tag_id" PRIMARY KEY("share_id","tag_id");

CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"selected" boolean DEFAULT true,
	"main" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"hashed_password" varchar NOT NULL,
	"is_active" boolean NOT NULL,
	"is_superuser" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"first_name" varchar,
	"last_name" varchar,
	"gender" varchar,
	"orientation" varchar,
	"birthday" date,
	"timezone" varchar,
	"bio" varchar,
	"is_cool" boolean DEFAULT false,
	"therapist" boolean DEFAULT false,
	"ai_ran" boolean DEFAULT false,
	"last_books" timestamp with time zone DEFAULT now(),
	"last_influencers" timestamp with time zone DEFAULT now(),
	"habitica_user_id" varchar,
	"habitica_api_token" varchar,
	"paid" boolean,
	"is_verified" boolean DEFAULT true,
	"cognito_id" varchar
);

DO $$ BEGIN
 ALTER TABLE "bookshelf" ADD CONSTRAINT "bookshelf_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "entries_tags" ADD CONSTRAINT "entries_tags_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "entries_tags" ADD CONSTRAINT "entries_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "field_entries" ADD CONSTRAINT "field_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "field_entries" ADD CONSTRAINT "field_entries_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "field_entries2" ADD CONSTRAINT "field_entries2_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "field_entries2" ADD CONSTRAINT "field_entries2_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "fields" ADD CONSTRAINT "fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "influencers" ADD CONSTRAINT "influencers_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "influencers" ADD CONSTRAINT "influencers_influencer_id_fields_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "model_hypers" ADD CONSTRAINT "model_hypers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "people" ADD CONSTRAINT "people_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "profile_matches" ADD CONSTRAINT "profile_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "profile_matches" ADD CONSTRAINT "profile_matches_match_id_users_id_fk" FOREIGN KEY ("match_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shares" ADD CONSTRAINT "shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shares_tags" ADD CONSTRAINT "shares_tags_share_id_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "shares"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shares_tags" ADD CONSTRAINT "shares_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "ix_bookshelf_created_at" ON "bookshelf" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_bookshelf_updated_at" ON "bookshelf" ("updated_at");
CREATE INDEX IF NOT EXISTS "ix_entries_created_at" ON "entries" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_entries_updated_at" ON "entries" ("updated_at");
CREATE INDEX IF NOT EXISTS "ix_entries_user_id" ON "entries" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_field_entries_created_at" ON "field_entries" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_field_entries_user_id" ON "field_entries" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_field_entries2_created_at" ON "field_entries2" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_field_entries2_day" ON "field_entries2" ("day");
CREATE INDEX IF NOT EXISTS "ix_field_entries2_field_id" ON "field_entries2" ("field_id");
CREATE INDEX IF NOT EXISTS "ix_field_entries2_user_id" ON "field_entries2" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_fields_created_at" ON "fields" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_fields_excluded_at" ON "fields" ("excluded_at");
CREATE INDEX IF NOT EXISTS "ix_fields_user_id" ON "fields" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_jobs_created_at" ON "jobs" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_jobs_machine_id" ON "jobs" ("machine_id");
CREATE INDEX IF NOT EXISTS "ix_jobs_method" ON "jobs" ("method");
CREATE INDEX IF NOT EXISTS "ix_jobs_run_on" ON "jobs" ("run_on");
CREATE INDEX IF NOT EXISTS "ix_jobs_state" ON "jobs" ("state");
CREATE INDEX IF NOT EXISTS "ix_jobs_updated_at" ON "jobs" ("updated_at");
CREATE INDEX IF NOT EXISTS "ix_machines_created_at" ON "machines" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_machines_updated_at" ON "machines" ("updated_at");
CREATE INDEX IF NOT EXISTS "ix_model_hypers_created_at" ON "model_hypers" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_model_hypers_model" ON "model_hypers" ("model");
CREATE INDEX IF NOT EXISTS "ix_model_hypers_model_version" ON "model_hypers" ("model_version");
CREATE INDEX IF NOT EXISTS "ix_notes_created_at" ON "notes" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_notes_entry_id" ON "notes" ("entry_id");
CREATE INDEX IF NOT EXISTS "ix_notes_user_id" ON "notes" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_people_user_id" ON "people" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_shares_email" ON "shares" ("email");
CREATE INDEX IF NOT EXISTS "ix_shares_last_seen" ON "shares" ("last_seen");
CREATE INDEX IF NOT EXISTS "ix_shares_user_id" ON "shares" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_tags_created_at" ON "tags" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_tags_user_id" ON "tags" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_users_cognito_id" ON "users" ("cognito_id");
CREATE INDEX IF NOT EXISTS "ix_users_created_at" ON "users" ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "ix_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "ix_users_last_books" ON "users" ("last_books");
CREATE INDEX IF NOT EXISTS "ix_users_last_influencers" ON "users" ("last_influencers");
CREATE INDEX IF NOT EXISTS "ix_users_updated_at" ON "users" ("updated_at");
