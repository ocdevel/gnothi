DO $$ BEGIN
 CREATE TYPE "aistate" AS ENUM('todo', 'skip', 'running', 'done');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "default_value_type" AS ENUM('value', 'average', 'ffill');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "field_type" AS ENUM('number', 'fivestar', 'check', 'option');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"n_notes" integer DEFAULT 0,
	"title" varchar,
	"text" varchar NOT NULL,
	"text_clean" varchar,
	"text_paras" varchar[],
	"ai_index_state" aistate DEFAULT 'todo',
	"ai_summarize_state" aistate DEFAULT 'todo',
	"ai_title" varchar,
	"ai_text" varchar,
	"ai_sentiment" varchar,
	"ai_keywords" varchar[],
	"user_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "entries_tags" (
	"entry_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries_tags" ADD CONSTRAINT "entries_tags_entry_id_tag_id" PRIMARY KEY("entry_id","tag_id");

CREATE TABLE IF NOT EXISTS "field_entries2" (
	"field_id" uuid NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"value" double precision,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "field_entries2" ADD CONSTRAINT "field_entries2_field_id_day" PRIMARY KEY("field_id","day");

CREATE TABLE IF NOT EXISTS "fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" field_type DEFAULT 'fivestar',
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"excluded_at" timestamp with time zone,
	"default_value" default_value_type DEFAULT 'value',
	"default_value_value" double precision,
	"attributes" json,
	"service" varchar,
	"service_id" varchar,
	"user_id" uuid NOT NULL,
	"influencer_score" double precision DEFAULT 0,
	"next_pred" double precision DEFAULT 0,
	"avg" double precision DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "keyvalues" (
	"key" varchar PRIMARY KEY NOT NULL,
	"value" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"relation" varchar,
	"issues" varchar,
	"bio" varchar,
	"user_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"email" boolean DEFAULT false,
	"username" boolean DEFAULT true,
	"first_name" boolean DEFAULT false,
	"last_name" boolean DEFAULT false,
	"gender" boolean DEFAULT false,
	"orientation" boolean DEFAULT false,
	"birthday" boolean DEFAULT false,
	"timezone" boolean DEFAULT false,
	"bio" boolean DEFAULT false,
	"people" boolean DEFAULT false,
	"fields" boolean DEFAULT false,
	"books" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "shares_tags" (
	"share_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"selected" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "shares_tags" ADD CONSTRAINT "shares_tags_share_id_tag_id" PRIMARY KEY("share_id","tag_id");

CREATE TABLE IF NOT EXISTS "shares_users" (
	"share_id" uuid NOT NULL,
	"obj_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shares_users" ADD CONSTRAINT "shares_users_share_id_obj_id" PRIMARY KEY("share_id","obj_id");

CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"selected" boolean DEFAULT true,
	"main" boolean DEFAULT false,
	"sort" integer DEFAULT 0 NOT NULL,
	"ai_index" boolean DEFAULT true,
	"ai_summarize" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"cognito_id" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"username" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"gender" varchar,
	"orientation" varchar,
	"birthday" date,
	"timezone" varchar,
	"bio" varchar,
	"is_superuser" boolean DEFAULT false,
	"is_cool" boolean DEFAULT false,
	"therapist" boolean DEFAULT false,
	"n_tokens" integer DEFAULT 0,
	"affiliate" varchar,
	"ai_ran" boolean DEFAULT false,
	"last_books" timestamp with time zone,
	"last_influencers" timestamp with time zone,
	"habitica_user_id" varchar,
	"habitica_api_token" varchar
);

CREATE TABLE IF NOT EXISTS "ws_connections" (
	"connection_id" varchar PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL
);

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
 ALTER TABLE "people" ADD CONSTRAINT "people_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ws_connections" ADD CONSTRAINT "ws_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "ix_entries_user_id" ON "entries" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_entries_created_at" ON "entries" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_entries_updated_at" ON "entries" ("updated_at");
CREATE INDEX IF NOT EXISTS "ix_field_entries2_user_id" ON "field_entries2" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_field_entries2_created_at" ON "field_entries2" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_field_entries2_day" ON "field_entries2" ("day");
CREATE INDEX IF NOT EXISTS "ix_field_entries2_field_id" ON "field_entries2" ("field_id");
CREATE INDEX IF NOT EXISTS "ix_fields_excluded_at" ON "fields" ("excluded_at");
CREATE INDEX IF NOT EXISTS "ix_fields_user_id" ON "fields" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_fields_created_at" ON "fields" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_people_user_id" ON "people" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_shares_user_id" ON "shares" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_shares_created_at" ON "shares" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_tags_user_id" ON "tags" ("user_id");
CREATE INDEX IF NOT EXISTS "ix_tags_created_at" ON "tags" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_users_last_books" ON "users" ("last_books");
CREATE INDEX IF NOT EXISTS "ix_users_last_influencers" ON "users" ("last_influencers");
CREATE UNIQUE INDEX IF NOT EXISTS "ix_users_cognito_id" ON "users" ("cognito_id");
CREATE INDEX IF NOT EXISTS "ix_users_created_at" ON "users" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_users_updated_at" ON "users" ("updated_at");
CREATE UNIQUE INDEX IF NOT EXISTS "ix_users_username" ON "users" ("username");
CREATE UNIQUE INDEX IF NOT EXISTS "ix_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "ix_ws_connections_user_id" ON "ws_connections" ("user_id");