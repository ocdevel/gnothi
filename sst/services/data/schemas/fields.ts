import {users, userId} from './users'

import {InferModel} from 'drizzle-orm'
import {pgTable, index, varchar, uuid, pgEnum, doublePrecision, timestamp, json} from 'drizzle-orm/pg-core';
import {idCol, tsCol} from './utils'

export const fieldTypes = pgEnum('field_type', [
  // medication changes / substance intake
  // sleep, diet, weight
  "number",
  // happiness score
  "fivestar",
  // exercise
  "check",
  // moods (happy, sad, anxious, wired, bored, ..)
  "option"
  // think of more
  // weather_api?
  // text entries?
])
export const defaultValTypes = pgEnum('default_value_type', [
  "value",  // which includes None
  "average",
  "ffill"
])

/**
 * Entries that change over time. Uses:
 * - Charts
 * - Effects of sentiment, topics on entries
 * - Global trends (exercise -> 73% happiness)
 */
export const fields = pgTable('fields', {
  id: idCol(),
  type: fieldTypes("type").default("fivestar"),
  name: varchar('name').notNull(),
  // Start entries/graphs/correlations here
  created_at: tsCol('created_at'),
  // Don't actually delete fields, unless it's the same day. Instead
  // stop entries/graphs/correlations here
  excluded_at: timestamp('excluded_at', {withTimezone: true}),
  default_value: defaultValTypes("default_value").default("value"),
  default_value_value: doublePrecision('default_value_value'),
  // option{single_or_multi, options:[], ..}
  // number{float_or_int, ..}
  attributes: json("attributes"),
  service: varchar('service'),
  // Used if pulling from external service
  service_id: varchar('service_id'),

  user_id: userId(),

  // Populated via ml.influencers.
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

export type Field = InferModel<typeof fields>
