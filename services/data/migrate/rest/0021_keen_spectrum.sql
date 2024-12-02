CREATE TABLE "notifs_groups" (
	"user_id" uuid,
	"obj_id" uuid,
	"count" integer DEFAULT 0,
	"last_seen" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifs_notes" (
	"user_id" uuid,
	"obj_id" uuid,
	"count" integer DEFAULT 0,
	"last_seen" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifs_shares" (
	"user_id" uuid,
	"obj_id" uuid,
	"count" integer DEFAULT 0,
	"last_seen" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifs_groups" ADD CONSTRAINT "notifs_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifs_groups" ADD CONSTRAINT "notifs_groups_obj_id_groups_id_fk" FOREIGN KEY ("obj_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifs_notes" ADD CONSTRAINT "notifs_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifs_notes" ADD CONSTRAINT "notifs_notes_obj_id_entries_id_fk" FOREIGN KEY ("obj_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifs_shares" ADD CONSTRAINT "notifs_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifs_shares" ADD CONSTRAINT "notifs_shares_obj_id_shares_id_fk" FOREIGN KEY ("obj_id") REFERENCES "public"."shares"("id") ON DELETE no action ON UPDATE no action;