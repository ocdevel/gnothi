import {userId, users} from './users'

import {
  pgTable,
  index,
  text,
  date,
  varchar,
  uuid,
  pgEnum,
  doublePrecision,
  timestamp,
  json,
  primaryKey, jsonb, integer,
} from 'drizzle-orm/pg-core';
import {InferModel} from 'drizzle-orm'

import {fields, fieldId} from "./fields"
import {idCol, tsCol} from "./utils";

// Before PK being based on field_id+day, I had a buggier implementation which allowed multiple entries per day.
// This had a lot of timezone issues. I'm keeping around the data for now until I know it's squared away
export const fieldEntriesOld = pgTable('field_entries', {
  id: idCol(),
  value: doublePrecision('value'),
  created_at: tsCol('created_at'),
  user_id: userId(),
  field_id: fieldId(),
}, (table) => {
  return {
    ix_field_entries_created_at: index("ix_field_entries_created_at").on(table.created_at),
    ix_field_entries_user_id: index("ix_field_entries_user_id").on(table.user_id),
    // TODO day?
  }
})

export const fieldEntries = pgTable('field_entries2', {
  field_id: fieldId(),
  day: date('day').notNull(),
  created_at: timestamp('created_at', {withTimezone: true}).defaultNow(),
  value: doublePrecision('value'),
  user_id: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),

  // gotta figure out how I'm handling these things in the new setup
  dupes: jsonb('dupes'),
  dupe: integer('dupe').default(0)
}, (table) => {
  return {
    pk: primaryKey(table.field_id, table.day),
    ix_field_entries2_user_id: index("ix_field_entries2_user_id").on(table.user_id),
    ix_field_entries2_created_at: index("ix_field_entries2_created_at").on(table.created_at),
    ix_field_entries2_day: index("ix_field_entries2_day").on(table.day),
    ix_field_entries2_field_id: index("ix_field_entries2_field_id").on(table.field_id),
  }
})

export type FieldEntry = InferModel<typeof fieldEntries>
