import {boolean, index, pgTable, varchar, uuid, primaryKey, InferModel} from "drizzle-orm/pg-core";
import {idCol, tsCol} from "./utils";
import {userId, users} from "./users";
import {tags} from './tags'

export const shares = pgTable('shares', {
  id: idCol(),
  user_id: userId(),
  created_at: tsCol('created_at'),

  // profile = sa.Column(sa.Boolean, server_default="false")
  email: boolean("email").default(false),
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

  // last_seen = DateCol()
  // new_entries = sa.Column(sa.Integer, server_default=sa.text("0"))

}, (table) => {
  return {
    ix_shares_user_id: index("ix_shares_user_id").on(table.user_id),
    ix_shares_created_at: index("ix_shares_created_at").on(table.created_at),
  }
})

export type Share = InferModel<typeof shares>

export const sharesTags = pgTable('shares_tags', {
  share_id: uuid("share_id").notNull().references(() => shares.id, {onDelete: 'cascade'}),
  tag_id: uuid("tag_id").notNull().references(() => tags.id, {onDelete: 'cascade'}),
  selected: boolean("selected").default(true),
}, (table) => {
  return {
    pk: primaryKey(table.share_id, table.tag_id)
  }
})

export type ShareTag = InferModel<typeof sharesTags>

export const sharesUsers = pgTable('shares_users', {
  share_id: uuid("share_id").notNull().references(() => shares.id, {onDelete: 'cascade'}),
  obj_id: uuid("obj_id").notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => {
  return {
    pk: primaryKey(table.share_id, table.obj_id)
  }
})

export type ShareUser = InferModel<typeof sharesUsers>
