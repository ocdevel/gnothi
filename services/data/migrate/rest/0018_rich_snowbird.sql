CREATE TABLE IF NOT EXISTS "shares_groups" (
	"share_id" uuid NOT NULL,
	"obj_id" uuid NOT NULL,
	CONSTRAINT "shares_groups_pkey" PRIMARY KEY("share_id","obj_id")
);
--> statement-breakpoint
ALTER TABLE "shares" RENAME COLUMN "profile" TO "username";--> statement-breakpoint
ALTER TABLE "shares_tags" RENAME COLUMN "tag_id" TO "obj_id";--> statement-breakpoint
ALTER TABLE "shares_tags" DROP CONSTRAINT "shares_tags_tag_id_fkey";
--> statement-breakpoint
DROP INDEX IF EXISTS "ix_shares_email";--> statement-breakpoint
ALTER TABLE "bookshelf" DROP CONSTRAINT "bookshelf_pkey";--> statement-breakpoint
ALTER TABLE "entries_tags" DROP CONSTRAINT "entries_tags_pkey";--> statement-breakpoint
ALTER TABLE "field_entries2" DROP CONSTRAINT "field_entries2_pkey";--> statement-breakpoint
ALTER TABLE "group_notifs" DROP CONSTRAINT "group_notifs_user_id_obj_id";--> statement-breakpoint
ALTER TABLE "groups_users" DROP CONSTRAINT "groups_users_user_id_group_id";--> statement-breakpoint
ALTER TABLE "influencers" DROP CONSTRAINT "influencers_pkey";--> statement-breakpoint
ALTER TABLE "shares_tags" DROP CONSTRAINT "shares_tags_pkey";--> statement-breakpoint
ALTER TABLE "shares_users" DROP CONSTRAINT "shares_users_share_id_obj_id";--> statement-breakpoint
ALTER TABLE "shares" ALTER COLUMN "fields" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ALTER COLUMN "books" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ALTER COLUMN "username" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "bookshelf" ADD CONSTRAINT "bookshelf_pkey" PRIMARY KEY("book_id","user_id");--> statement-breakpoint
ALTER TABLE "entries_tags" ADD CONSTRAINT "entries_tags_pkey" PRIMARY KEY("entry_id","tag_id");--> statement-breakpoint
ALTER TABLE "field_entries2" ADD CONSTRAINT "fields_entries2_pkey" PRIMARY KEY("field_id","day");--> statement-breakpoint
ALTER TABLE "group_notifs" ADD CONSTRAINT "groups_notifs_pkey" PRIMARY KEY("user_id","obj_id");--> statement-breakpoint
ALTER TABLE "groups_users" ADD CONSTRAINT "groups_users_pkey" PRIMARY KEY("user_id","group_id");--> statement-breakpoint
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_pkey" PRIMARY KEY("field_id","influencer_id");--> statement-breakpoint
ALTER TABLE "shares_tags" ADD CONSTRAINT "shares_tags_pkey" PRIMARY KEY("share_id","obj_id");--> statement-breakpoint
ALTER TABLE "shares_users" ADD CONSTRAINT "shares_users_pkey" PRIMARY KEY("share_id","obj_id");--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "email_visible" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "first_name" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "last_name" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "gender" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "orientation" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "birthday" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "timezone" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "bio" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares" ADD COLUMN "people" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shares_users" ADD COLUMN "email" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_shares_created_at" ON "shares" ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shares_tags" ADD CONSTRAINT "shares_tags_obj_id_tags_id_fk" FOREIGN KEY ("obj_id") REFERENCES "tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shares_groups" ADD CONSTRAINT "shares_groups_share_id_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "shares"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shares_groups" ADD CONSTRAINT "shares_groups_obj_id_groups_id_fk" FOREIGN KEY ("obj_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 1: Insert into shares_users
INSERT INTO shares_users (share_id, obj_id, email)
SELECT shares.id, users.id, users.email
FROM shares
JOIN users ON shares.email = users.email;