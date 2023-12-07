import {userId, users} from './users'
import {
  pgTable,
  index,
  varchar,
  uuid,
  pgEnum,
  boolean, integer, doublePrecision, primaryKey,
} from 'drizzle-orm/pg-core';
import {userId} from './users'
import {InferInsertModel, InferModel, InferSelectModel} from 'drizzle-orm'
import {idCol, tsCol} from "./utils";

// TODO bring in notes_notifs

export const groupPrivacy = pgEnum('groupprivacy', [
  'public',
  'matchable',
  'private',
])

export const groupRoles = pgEnum('grouproles', [
  'member',
  'owner',
  'admin',
  'banned',
])

export const groups = pgTable('groups', {
  id: idCol(),
  created_at: tsCol("created_at"),
  updated_at: tsCol("updated_at"),

  owner_id: userId("owner_id"),
  title: varchar("title").notNull(),
  text_short: varchar("text_short").notNull(),
  text_long: varchar("text_long"),
  privacy: groupPrivacy("privacy").notNull().default("public"),
  official: boolean("official").default(false),

  n_members: integer("n_members").notNull().default(1),
  n_messages: integer("n_messages").notNull().default(0),
  last_message: tsCol("last_message").notNull().defaultNow(),
  owner_name: varchar("owner_name"),

  perk_member: doublePrecision("perk_member"),
  perk_member_donation: boolean("perk_member_donation").default(false),
  perk_entry: doublePrecision("perk_entry"),
  perk_entry_donation: boolean("perk_entry_donation").default(false),
  perk_video: doublePrecision("perk_video"),
  perk_video_donation: boolean("perk_video_donation").default(false),
}, (t) => ({
  ix_groups_owner_id: index("ix_groups_owner_id").on(t.owner_id),
  ix_groups_privacy: index("ix_groups_privacy").on(t.privacy)
}))
export const groupId = (name="group_id") => uuid(name).notNull().references(() => groups.id, {onDelete: 'cascade'})
export type GroupInsert = InferInsertModel<typeof groups>
export type GroupsSelect = InferSelectModel<typeof groups>

export const groupsUsers = pgTable("groups_users", {
  user_id: userId(),
  group_id: groupId(),

  // Temporary/private name & id assigned for this user for this group.
  // If they opt to expose real username, it will be used instead
  username: varchar("username").notNull(),//.default(() => petname.Generate()), // auto-generate a random name (adjective-animal

  joined_at: tsCol("created_at"),
  role: groupRoles("role").notNull().default("member")
}, (t) => ({
  pk: primaryKey(t.user_id, t.group_id)
}))
export type GroupsUsersInsert = InferInsertModel<typeof groupsUsers>
export type GroupsUsersSelect = InferSelectModel<typeof groupsUsers>

export const groupMessages = pgTable("group_messages", {
  id: idCol(),
  group_id: groupId(),
  user_id: userId(),
  created_at: tsCol("created_at"),
  updated_at: tsCol("updated_at"),
  text: varchar("text").notNull(),
}, (t) => ({
  ix_group_messages_group_id: index("ix_group_messages_group_id").on(t.group_id),
  ix_group_messages_user_id: index("ix_group_messages_user_id").on(t.user_id),
  ix_group_messages_created_at: index("ix_group_messages_created_at").on(t.created_at),
}))
export type GroupMessagesInsert = InferInsertModel<typeof groupMessages>
export type GroupMessagesSelect = InferSelectModel<typeof groupMessages>

export const groupNotifs = pgTable("group_notifs", {
  user_id: userId(),
  obj_id: groupId("obj_id"),
  count: integer("count").default(0),
  last_seen: tsCol("last_seen")
}, (t) => ({
  pk: primaryKey(t.user_id, t.obj_id)
}))
export type GroupNotifsInsert = InferInsertModel<typeof groupNotifs>
export type GroupNotifsSelect = InferSelectModel<typeof groupNotifs>