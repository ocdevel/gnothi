DO $$ BEGIN
 CREATE TYPE "notetypes" AS ENUM('label', 'note', 'resource', 'comment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"entry_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" notetypes DEFAULT 'comment' NOT NULL,
	"text" varchar NOT NULL,
	"private" boolean DEFAULT false
);

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

CREATE INDEX IF NOT EXISTS "ix_notes_created_at" ON "notes" ("created_at");
CREATE INDEX IF NOT EXISTS "ix_notes_entry_id" ON "notes" ("entry_id");
CREATE INDEX IF NOT EXISTS "ix_notes_user_id" ON "notes" ("user_id");