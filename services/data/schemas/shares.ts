import {boolean, index, pgTable, varchar, uuid, primaryKey, timestamp, integer} from "drizzle-orm/pg-core";
import {InferModel, InferSelectModel, sql} from 'drizzle-orm'
import {idCol, tsCol} from "./utils";
import {userId, users} from "./users";
import {tagId, tags} from './tags'

// TODO currently using the old shares system until after a few releases, prompt, etc - then we'll get the new shares
// system working.
export const shares = pgTable("shares", {
	id: idCol(),
	userId: userId(),
	email: varchar("email", { length: 255 }),
	fields: boolean("fields"),
	books: boolean("books"),
	profile: boolean("profile"),
	lastSeen: timestamp("last_seen", { withTimezone: true, mode: 'string' }).defaultNow(),
	newEntries: integer("new_entries").default(0),
},
(table) => {
	return {
		ixSharesEmail: index("ix_shares_email").on(table.email),
		ixSharesLastSeen: index("ix_shares_last_seen").on(table.lastSeen),
		ixSharesUserId: index("ix_shares_user_id").on(table.userId),
	}
});

// export const shares = pgTable('shares', {
//   id: idCol(),
//   user_id: userId(),
//   created_at: tsCol('created_at'),
//
//   // profile = sa.Column(sa.Boolean, server_default="false")
//   email: boolean("email").default(false),
//   username: boolean("username").default(true),
//   first_name: boolean("first_name").default(false),
//   last_name: boolean("last_name").default(false),
//   gender: boolean("gender").default(false),
//   orientation: boolean("orientation").default(false),
//   birthday: boolean("birthday").default(false),
//   timezone: boolean("timezone").default(false),
//   bio: boolean("bio").default(false),
//   people: boolean("people").default(false),
//
//   fields: boolean("fields").default(false),
//   books: boolean("books").default(false),
//
//   // last_seen = DateCol()
//   // new_entries = sa.Column(sa.Integer, server_default=sa.text("0"))
//
// }, (table) => {
//   return {
//     ix_shares_user_id: index("ix_shares_user_id").on(table.user_id),
//     ix_shares_created_at: index("ix_shares_created_at").on(table.created_at),
//   }
// })

export type ShareSelect = InferSelectModel<typeof shares>

export const shareId = (col="share_id") => uuid(col).notNull().references(() => shares.id, {onDelete: 'cascade'})

export const sharesTags = pgTable('shares_tags', {
  share_id: shareId(),
  tag_id: tagId(),
  selected: boolean("selected").default(true),
}, (table) => {
  return {
    pk: primaryKey({
			name: "pk_shares_tags",
			columns: [table.share_id, table.tag_id]
		})
  }
})
export type ShareTagSelect = InferSelectModel<typeof sharesTags>

export const sharesUsers = pgTable('shares_users', {
  share_id: uuid("share_id").notNull().references(() => shares.id, {onDelete: 'cascade'}),
	// TODO consider consolidating the tables (sharesJoins) with multiple optional FKs and attrs
  obj_id: uuid("obj_id").notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => {
  return {
    pk: primaryKey({
			name: "pk_shares_users",
			columns: [table.share_id, table.obj_id]
		})
  }
})
export type ShareUserSelect = InferSelectModel<typeof sharesUsers>
