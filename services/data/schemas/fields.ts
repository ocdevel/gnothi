import {users, userId} from './users'

import {InferInsertModel, InferSelectModel} from 'drizzle-orm'
import {
  pgTable,
  index,
  varchar,
  uuid,
  pgEnum,
  doublePrecision,
  timestamp,
  json,
  boolean,
  integer, date
} from 'drizzle-orm/pg-core';
import {idCol, tsCol} from './utils'

export const fieldTypes = pgEnum('fieldtype', [
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
export const defaultValTypes = pgEnum('defaultvaluetypes', [
  "value",  // which includes None
  "average",
  "ffill"
])
export const resetPeriods = pgEnum("resetperiods", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "forever", // infinite counter, eg rewards
  // "none", // don't even use this feature? this is handled by scoring=on/off
])
export const lanes = pgEnum("lanes", [
  "habit",
  "daily",
  "todo",
  "custom",
  "reward",
])

/**
 * Habit-tracking will operate like templates combining multiple columns. Eg
 * - Habits: type:number reset_period:daily reset_amount:1 monday:true, tuesday:true ...
 * - Dailies: type=check, (...habit)
 * - Todo: type=check, reset_period=forever, (...daily)
 * - Rewards: ???
 */

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

  // ---
  // ---
  // ---
  // NEW STUFF
  // ---
  // ---
  // ---

  lane: lanes("lane").default("custom"),
  // sort: integer("sort").default(0),

  // analyze
  // ---
  analyze_enabled: boolean("analyze_enabled").default(true),
  // Don't actually delete fields, unless it's the same day. Instead stop entries/graphs/correlations here
  // TODO consider removing this. We can just let them enable/disable and it goes back into the analysis?
  analyze_disabled_at: timestamp('analyze_disabled_at', {withTimezone: true}),

  // score
  // ---
  score_enabled: boolean("score_enabled").default(false),
  score_total: doublePrecision("score_total").default(0),
  // when using scoring; are positive numbers good (pushups), or bad (beers)?
  score_up_good: boolean("score_up_good").default(true),
  // what's the score for "today" (unlike the total)
  score_period: doublePrecision("score_period").default(0),
  streak: integer("streak").default(0),

  // Reset Periods
  // ---
  reset_period: resetPeriods("reset_period").default("forever"),
  reset_quota: integer("reset_quota").default(1), // how many times per week this should be done
  reset_every: integer("reset_every").default(1), // repeat every 2 weeks
  monday: boolean("monday").default(true),
  tuesday: boolean("tuesday").default(true),
  wednesday: boolean("wednesday").default(true),
  thursday: boolean("thursday").default(true),
  friday: boolean("friday").default(true),
  saturday: boolean("saturday").default(true),
  sunday: boolean("sunday").default(true),
  date_start: date("date_start"), // is there any value in this?
  date_due: date("date_due"),

  notes: varchar("notes"),
}, (table) => {
  return {
    ix_fields_excluded_at: index("ix_fields_excluded_at").on(table.excluded_at),
    ix_fields_user_id: index("ix_fields_user_id").on(table.user_id),
    ix_fields_created_at: index("ix_fields_created_at").on(table.created_at),

    // FIXME add indexes for new stuff
  }
})


export type Field = InferSelectModel<typeof fields>
export const fieldId = (name='field_id') => uuid(name).notNull().references(() => fields.id, {onDelete: 'cascade'})