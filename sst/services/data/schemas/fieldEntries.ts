import {users} from './users'

import { pgTable, index, text, date, varchar, uuid, pgEnum, doublePrecision, timestamp, json, primaryKey } from 'drizzle-orm/pg-core';

import {fields} from "./fields"

export const fieldEntries = pgTable('field_entries2', {
  field_id: uuid('id').notNull().references(() => fields.id, {onDelete: 'cascade'}),
  day: date('day').notNull(),
  created_at: timestamp('created_at', {withTimezone: true}).defaultNow(),
  value: doublePrecision('value'),
  user_id: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => {
  return {
    pk: primaryKey(table.field_id, table.day),
    ix_field_entries2_user_id: index("ix_field_entries2_user_id").on(table.user_id),
    ix_field_entries2_created_at: index("ix_field_entries2_created_at").on(table.created_at),
    ix_field_entries2_day: index("ix_field_entries2_day").on(table.day),
    ix_field_entries2_field_id: index("ix_field_entries2_field_id").on(table.field_id),
  }
})
