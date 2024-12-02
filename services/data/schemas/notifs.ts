import {integer, pgTable, timestamp, uuid} from "drizzle-orm/pg-core";
import {users} from "./users";
import {entries} from "./entries";
import {shares} from "./shares";
import {groups} from "./groups";
import {relations} from "drizzle-orm";

export const notifsShares = pgTable('notifs_shares', {
  user_id: uuid('user_id').references(() => users.id),
  obj_id: uuid('obj_id').references(() => shares.id),
  count: integer('count').default(0),
  last_seen: timestamp('last_seen').defaultNow(),
});

export const notifsGroups = pgTable('notifs_groups', {
  user_id: uuid('user_id').references(() => users.id),
  obj_id: uuid('obj_id').references(() => groups.id),
  count: integer('count').default(0),
  last_seen: timestamp('last_seen').defaultNow(),
});

export const notifsNotes = pgTable('notifs_notes', {
  user_id: uuid('user_id').references(() => users.id),
  obj_id: uuid('obj_id').references(() => entries.id),
  count: integer('count').default(0),
  last_seen: timestamp('last_seen').defaultNow(),
});

export const notifsSharesRelations = relations(notifsShares, ({ one }) => ({
  user: one(users, {
    fields: [notifsShares.user_id],
    references: [users.id],
  }),
  share: one(shares, {
    fields: [notifsShares.obj_id],
    references: [shares.id],
  }),
}));

export const notifsGroupsRelations = relations(notifsGroups, ({ one }) => ({
  user: one(users, {
    fields: [notifsGroups.user_id],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [notifsGroups.obj_id],
    references: [groups.id],
  }),
}));

export const notifsNotesRelations = relations(notifsNotes, ({ one }) => ({
  user: one(users, {
    fields: [notifsNotes.user_id],
    references: [users.id],
  }),
  entry: one(entries, {
    fields: [notifsNotes.obj_id],
    references: [entries.id],
  }),
}));
