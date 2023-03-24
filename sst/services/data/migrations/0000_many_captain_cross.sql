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
ALTER TABLE "entries_tags" ADD CONSTRAINT "entries_tags_entry_id_tag_id" PRIMARY KEY("entry_id","tag_id");

CREATE TABLE IF NOT EXISTS "field_entries2" (
	"id" uuid NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"value" double precision,
	"user_id" uuid NOT NULL
);
ALTER TABLE "field_entries2" ADD CONSTRAINT "field_entries2_id_day" PRIMARY KEY("id","day");

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
	"user_id" uuid NOT NULL,
	"connection_id" varchar NOT NULL
);
ALTER TABLE "ws_connections" ADD CONSTRAINT "ws_connections_user_id_connection_id" PRIMARY KEY("user_id","connection_id");

DO $$ BEGIN
 ALTER TABLE entries ADD CONSTRAINT entries_user_id_users_id_fk FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE entries_tags ADD CONSTRAINT entries_tags_entry_id_entries_id_fk FOREIGN KEY ("entry_id") REFERENCES entries("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE entries_tags ADD CONSTRAINT entries_tags_tag_id_tags_id_fk FOREIGN KEY ("tag_id") REFERENCES tags("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE field_entries2 ADD CONSTRAINT field_entries2_id_fields_id_fk FOREIGN KEY ("id") REFERENCES fields("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE field_entries2 ADD CONSTRAINT field_entries2_user_id_users_id_fk FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE fields ADD CONSTRAINT fields_user_id_users_id_fk FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE tags ADD CONSTRAINT tags_user_id_users_id_fk FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE ws_connections ADD CONSTRAINT ws_connections_user_id_users_id_fk FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS ix_entries_user_id ON entries ("user_id");
CREATE INDEX IF NOT EXISTS ix_entries_created_at ON entries ("created_at");
CREATE INDEX IF NOT EXISTS ix_entries_updated_at ON entries ("updated_at");
CREATE INDEX IF NOT EXISTS ix_field_entries2_user_id ON field_entries2 ("user_id");
CREATE INDEX IF NOT EXISTS ix_field_entries2_created_at ON field_entries2 ("created_at");
CREATE INDEX IF NOT EXISTS ix_field_entries2_day ON field_entries2 ("day");
CREATE INDEX IF NOT EXISTS ix_field_entries2_field_id ON field_entries2 ("id");
CREATE INDEX IF NOT EXISTS ix_fields_excluded_at ON fields ("excluded_at");
CREATE INDEX IF NOT EXISTS ix_fields_user_id ON fields ("user_id");
CREATE INDEX IF NOT EXISTS ix_fields_created_at ON fields ("created_at");
CREATE INDEX IF NOT EXISTS ix_tags_user_id ON tags ("user_id");
CREATE INDEX IF NOT EXISTS ix_tags_created_at ON tags ("created_at");
CREATE INDEX IF NOT EXISTS ix_users_last_books ON users ("last_books");
CREATE INDEX IF NOT EXISTS ix_users_last_influencers ON users ("last_influencers");
CREATE INDEX IF NOT EXISTS ix_users_cognito_id ON users ("cognito_id");
CREATE INDEX IF NOT EXISTS ix_users_created_at ON users ("created_at");
CREATE INDEX IF NOT EXISTS ix_users_updated_at ON users ("updated_at");
CREATE INDEX IF NOT EXISTS ix_users_username ON users ("username");
CREATE INDEX IF NOT EXISTS ix_users_email ON users ("email");