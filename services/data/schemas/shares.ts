import {boolean, index, pgTable, varchar, uuid, primaryKey, timestamp, integer} from "drizzle-orm/pg-core";
import {InferModel, InferSelectModel, sql} from 'drizzle-orm'
import {idCol, tsCol} from "./utils";
import {userId, users} from "./users";
import {tagId, tags} from './tags'
import {groupId} from "./groups";

// TODO currently using the old shares system until after a few releases, prompt, etc - then we'll get the new shares
// system working.
export const shares = pgTable("shares", {
	id: idCol(),
	user_id: userId(),
  created_at: tsCol('created_at'),

  // TODO
  // Keep email for first migration. Transfer it to sharesUsers (create new rows based on joined user.id).
  // Then remove this email, rename email_visible to email (boolean)
  email: boolean("email").default(false),

	// profile: boolean("profile"),
  username: boolean("username").default(true),
  first_name: boolean("first_name").default(false),
  last_name: boolean("last_name").default(false),
  gender: boolean("gender").default(false),
  orientation: boolean("orientation").default(false),
  birthday: boolean("birthday").default(false),
  timezone: boolean("timezone").default(false),
  bio: boolean("bio").default(false),
  people: boolean("people").default(false),

  fields: boolean("fields").default(false),
  books: boolean("books").default(false),

	last_seen: timestamp("last_seen", { withTimezone: true, mode: 'string' }).defaultNow(),
	new_entries: integer("new_entries").default(0),

},
(table) => {
	return {
		// ix_shares_email: index("ix_shares_email").on(table.email),
		ix_shares_last_seen: index("ix_shares_last_seen").on(table.last_seen),
		ix_shares_user_id: index("ix_shares_user_id").on(table.user_id),
    ix_shares_created_at: index("ix_shares_created_at").on(table.created_at),
	}
});

export type ShareSelect = InferSelectModel<typeof shares>

export const shareId = (col="share_id") => uuid(col).notNull().references(() => shares.id, {onDelete: 'cascade'})

export const sharesTags = pgTable('shares_tags', {
  share_id: shareId(),
  obj_id: tagId("obj_id"),
  selected: boolean("selected").default(true),
}, (table) => {
  return {
    pk: primaryKey({
			name: "shares_tags_pkey",
			columns: [table.share_id, table.obj_id]
		})
  }
})
export type ShareTagSelect = InferSelectModel<typeof sharesTags>

export const sharesUsers = pgTable('shares_users', {
  share_id: shareId(),
  obj_id: userId("obj_id"),

  // TODO remove this, when I'm sure we're pulling the relevant profile fields based on privacy to
  // be seen by viewer. For now, show email here on view, since they'll have used the email to initiate
  // sharing; meaning they already know it, so it's no privacy concern
  email: varchar("email", { length: 255 }),
}, (table) => {
  return {
    pk: primaryKey({
			name: "shares_users_pkey",
			columns: [table.share_id, table.obj_id]
		})
  }
})
export type ShareUserSelect = InferSelectModel<typeof sharesUsers>

export const sharesGroups = pgTable('shares_groups', {
  share_id: shareId(),
  obj_id: groupId("obj_id"),
}, (table) => {
  return {
    pk: primaryKey({
			name: "shares_groups_pkey",
			columns: [table.share_id, table.obj_id]
		})
  }
})

