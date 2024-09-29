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
  // eg: medication dosage, substance intake, sleep hours, calories, weight. Or for quota-based dailies, how many of this daily is due
  "number",
  // qualitative entries, eg: mood, sleep quality. 
  "fivestar",
  // Primarily for dailies & todos, eg: "take medicine", "write blog post", "exercise", "buy groceries"
  "check",
  // User-choice. Not currently implemented, but could support things like moods (happy, sad, anxious, wired, bored, ..)
  "option"
  // think of more: weather_api? text entries?
])

// When a field has a defaultValue (what to enter for that field if the user didn't log an entry for that day), these are the following options
export const defaultValTypes = pgEnum('defaultvaluetypes', [
  // A specific value, like 0. Eg, for an "alcohol" field it's safe to assume if you didn't log it, you didn't drink. Leaving this empty (None) is also
  // valid, as XGBoost can consider None a significant decision point (they forgot to enter, and that means something).
  "value",  
  // The average of all entries for this field. Eg, for "mood" it's safe to assume your mood, if not entered, is the average of all your mood entries
  "average",
  // Pull the last known entry for this field. Eg for medication dosage (if you're interested in analyzing changes in dosage), it's safe to assume that if you
  // didn't enter anything, then it hasn't changed since the last time you did.
  "ffill"
])

// How frequently is this daily due. For "daily", they can still specify which days it's due (monday-sunday). For the others, the field will also consider
// the reset_quota. Eg if reset_quota=2, and reset_period="weekly", then this field is due 2 times per week; but with no specific days - just "twice 
// eventually each week".
export const resetPeriods = pgEnum("resetperiods", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  // This one is special, and primarly just used for rewards. It means it's never technically "due", that is - the field doesn't reset its counter.
  "never",
])

// Lanes don't technically have impact on the logic of how fields operate. Instead, they're templates which pre-populate attributes. 
// habit: {type: number, score_enabled: true, reset_period: daily, reset_amount: 1, reset_quota: 1, [monday-sunday]: true}
// daily: {...habit, type: check}
// todo: {...daily, reset_period=never} 
// They are, however, used to determine the visual location (column) this field shows up in the UI.
export const lanes = pgEnum("lanes", [
  "habit",
  "daily",
  "todo",
  "custom",
  "reward",
])


export const fields = pgTable('fields', {
  id: idCol(),
  created_at: tsCol('created_at'),
  user_id: userId(),

  // type of the field, number|fivestar|check|option. 
  type: fieldTypes("type").default("fivestar"),

  // user-defined name of the field
  name: varchar('name').notNull(),
  
  // See comment on the defaultValue enum above
  default_value: defaultValTypes("default_value").default("value"),
  default_value_value: doublePrecision('default_value_value'),

  // not currently used, ignore
  attributes: json("attributes"), // option{single_or_multi, options:[], ..} number{float_or_int, ..}

  // If a 3rd-party service manages this field, the service name and id
  service: varchar('service'),
  service_id: varchar('service_id'),

  // The Influencers machine learning job, a separate Lambda, periodically calculates the following properties:
  // How much does this field contribute to all other fields, on average. That is, how "influential" is this field on your days in general (eg, sleep would rank high)
  influencer_score: doublePrecision("influencer_score").default(0),
  // What's the predicted next value for this field. ML will actually predict, for example, your sleep quality for today
  next_pred: doublePrecision("next_pred").default(0),
  // Just an average value of this field's entries
  avg: doublePrecision("avg").default(0),


  // Which lane does this belong to (see lanes enum above)
  lane: lanes("lane").default("custom"),
  // Sort order in this lane (visual column)
  sort: integer("sort").default(0),
  // Currently just for setting the point-value of a Reward. This is not the score (how well you're doing at this field), but instead a hard-coded "value"
  // for this field. Eg for rewards, how much is this reward worth (how many points should it deduct from `user.points` when cashed in).
  points: doublePrecision("points").default(0),

  // Is analysis enabled for this field. That means, should the machine learning Lambda include this field in the influencers calculation. Disabling
  // fields which are nonsensical is prudent, as it gives the ML algorithm a chance to focus on the more relevant fields.
  analyze_enabled: boolean("analyze_enabled").default(true),

  // Is scoring enabled for this field (can you lose or gain points). The main time to disable this is for the "custom" lane, which is used for data-tracking.
  // Eg your weight, medication dosage, sleep-quality, mood - none of these should impact `user.points`. 
  score_enabled: boolean("score_enabled").default(false),
  // The current score for this field. As in, over this field's lifetime, how well or poorly are you doing. 
  score_total: doublePrecision("score_total").default(0),
  // When using scoring; are positive numbers good (pushups), or bad (beers)?
  score_up_good: boolean("score_up_good").default(true),
  // What's the score for this current scoring period (eg "today" or "this week"). This is used to determine, at the end of a score_period, whether the 
  // field is considered "complete".
  score_period: doublePrecision("score_period").default(0),
  // How many times in a row has this field been completed. If a period goes by with this incomplete, this will reset.
  streak: integer("streak").default(0),

  // Reset Periods. Below are the attributes used to determine the technicals on how and when the field resets. Reseting a daily for example unchecks it for 
  // the next day. If score_enabled=true, these attributes are checked to determine whether the field is incomplete, in which case points are deducted.
  // ---
  // How often is this field due (see resetPeriod enum above)
  reset_period: resetPeriods("reset_period").default("daily"),
  // How many times per reset_period is this field due (eg 2 times per day, or 3 times per week)
  reset_quota: integer("reset_quota").default(1), 
  // More advanced: if reset_period=weekly, you can set this attirbute to 2 to make it "every other week". I don't think this attribute is currently in use?
  reset_every: integer("reset_every").default(1), 
  // monday-sunday. If reset_period=daily, you can mark specific days of the week this field is due.
  monday: boolean("monday").default(true),
  tuesday: boolean("tuesday").default(true),
  wednesday: boolean("wednesday").default(true),
  thursday: boolean("thursday").default(true),
  friday: boolean("friday").default(true),
  saturday: boolean("saturday").default(true),
  sunday: boolean("sunday").default(true),
  
  // I'm not sure what this was for, or if it's in use...
  date_start: date("date_start"),

  // When is this due. This would only be of value for lane=todo. It's not currently impelemnted, but it would go like this: you don't lose any points for 
  // a todo which isn't yet due; but after the due date, you lose points every day this todo isn't completed.
  date_due: date("date_due"),

  // User-defined note-to-self for this field.
  notes: varchar("notes"),

  // when a user starts a timer on a task, remember what it was for that task for ease of click
  timer: integer("timer").default(25),
}, (table) => {
  return {
    ix_fields_user_id: index("ix_fields_user_id").on(table.user_id),
    ix_fields_created_at: index("ix_fields_created_at").on(table.created_at),

    // FIXME add indexes for new stuff
    ix_fields_score_enabled: index("ix_fields_score_enabled").on(table.score_enabled),
    ix_fields_analyze_enabled: index("ix_fields_analyze_enabled").on(table.analyze_enabled),
    ix_fields_score_period: index("ix_fields_score_period").on(table.score_period),
    ix_fields_reset_period: index("ix_fields_reset_period").on(table.reset_period),

    // TODO Consider a composite index on these columns
    ix_fields_monday: index("ix_fields_monday").on(table.monday),
    ix_fields_tuesday: index("ix_fields_tuesday").on(table.tuesday),
    ix_fields_wednesday: index("ix_fields_wednesday").on(table.wednesday),
    ix_fields_thursday: index("ix_fields_thursday").on(table.thursday),
    ix_fields_friday: index("ix_fields_friday").on(table.friday),
    ix_fields_saturday: index("ix_fields_saturday").on(table.saturday),
    ix_fields_sunday: index("ix_fields_sunday").on(table.sunday),

  }
})

export type Field = InferSelectModel<typeof fields>
export const fieldId = (name='field_id') => uuid(name).notNull().references(() => fields.id, {onDelete: 'cascade'})