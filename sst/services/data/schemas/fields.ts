import {users} from './users'

import { pgTable, index, varchar, uuid, pgEnum, doublePrecision, timestamp, json } from 'drizzle-orm/pg-core';

export const fieldTypes = pgEnum('field_type', ["number", "fivestar", "check", "option"])
export const defaultValTypes = pgEnum('default_value_type', ["value", "average", "ffill"])
export const fields = pgTable('fields', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  type: fieldTypes("type").default("fivestar"),
  name: varchar('name').notNull(),
  created_at: timestamp('created_at', {withTimezone: true}).defaultNow(),
  excluded_at: timestamp('excluded_at', {withTimezone: true}),
  default_value: defaultValTypes("default_value").default("value"),
  default_value_value: doublePrecision('default_value_value'),
  attributes: json("attributes"),
  service: varchar('service'),
  service_id: varchar('service_id'),
  user_id: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
  influencer_score: doublePrecision("influencer_score").default(0),
  next_pred: doublePrecision("next_pred").default(0),
  avg: doublePrecision("avg").default(0),
}, (table) => {
  return {
    ix_fields_excluded_at: index("ix_fields_excluded_at").on(table.excluded_at),
    ix_fields_user_id: index("ix_fields_user_id").on(table.user_id),
    ix_fields_created_at: index("ix_fields_created_at").on(table.created_at),
  }
})
