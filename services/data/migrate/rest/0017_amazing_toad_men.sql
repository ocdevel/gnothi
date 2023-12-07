DO $$ BEGIN
 CREATE TYPE "groupprivacy" AS ENUM('public', 'matchable', 'private');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "grouproles" AS ENUM('member', 'owner', 'admin', 'banned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"text" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_notifs" (
	"user_id" uuid NOT NULL,
	"obj_id" uuid NOT NULL,
	"count" integer DEFAULT 0,
	"last_seen" timestamp with time zone DEFAULT now(),
	CONSTRAINT group_notifs_user_id_obj_id PRIMARY KEY("user_id","obj_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"owner_id" uuid NOT NULL,
	"title" varchar NOT NULL,
	"text_short" varchar NOT NULL,
	"text_long" varchar,
	"privacy" "groupprivacy" DEFAULT 'public' NOT NULL,
	"official" boolean DEFAULT false,
	"n_members" integer DEFAULT 1 NOT NULL,
	"n_messages" integer DEFAULT 0 NOT NULL,
	"last_message" timestamp with time zone DEFAULT now() NOT NULL,
	"owner_name" varchar,
	"perk_member" double precision,
	"perk_member_donation" boolean DEFAULT false,
	"perk_entry" double precision,
	"perk_entry_donation" boolean DEFAULT false,
	"perk_video" double precision,
	"perk_video_donation" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groups_users" (
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"username" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"role" "grouproles" DEFAULT 'member' NOT NULL,
	CONSTRAINT groups_users_user_id_group_id PRIMARY KEY("user_id","group_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_group_messages_group_id" ON "group_messages" ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_group_messages_user_id" ON "group_messages" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_group_messages_created_at" ON "group_messages" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_groups_owner_id" ON "groups" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_groups_privacy" ON "groups" ("privacy");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_notifs" ADD CONSTRAINT "group_notifs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_notifs" ADD CONSTRAINT "group_notifs_obj_id_groups_id_fk" FOREIGN KEY ("obj_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groups_users" ADD CONSTRAINT "groups_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groups_users" ADD CONSTRAINT "groups_users_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
