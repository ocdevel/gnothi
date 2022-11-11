import {z} from 'zod'
import {Passthrough, IdCol, DateCol} from './utils'
import {Route} from './api'
export * as Fields from './fields'
import {v4 as uuid} from 'uuid'

export const FieldType = z.enum([
  // medication changes / substance intake
  // exercise, sleep, diet, weight
  "number",

  // happiness score
  "fivestar",

  // periods
  "check",

  // moods (happy, sad, anxious, wired, bored, ..)
  "option",

  // think of more
  // weather_api?
  // text entries?
]).default("fivestar")

export const DefaultValueTypes = z.enum([
  "value",  // which includes None
  "average",
  "ffill"
]).default("value")

export const Field = z.object({
  //Entries that change over time. Uses:
  // * Charts
  // * Effects of sentiment, topics on entries
  // * Global trends (exercise -> 73% happiness)
  id: IdCol,

  type: FieldType,
  name: z.string(),
  // Start entries/graphs/correlations here
  created_at: z.date().default(() => new Date()),
  // Don't actually delete fields, unless it's the same day. Instead
  // stop entries/graphs/correlations here
  excluded_at: z.date().optional(),
  default_value: DefaultValueTypes,
  default_value_value: z.number().default(0),
  // option{single_or_multi, options:[], ..}
  // number{float_or_int, ..}
  attributes: z.object({}).passthrough().default({}), // JSON TODO
  // Used if pulling from external service
  service: z.string().optional(),
  service_id: z.string().optional(),

  user_id: z.string().uuid(), // FK users.id

  // Populated via ml.influencers.
  influencer_score: z.number().default(0),
  next_pred: z.number().default(0),
  avg: z.number().default(0)
})
export type Field = z.infer<typeof Field>

export const FieldEntry = z.object({
  // day & field_id may be queries independently, so compound primary-key not enough - index too
  field_id: IdCol,
  day: DateCol,

  created_at: DateCol,
  value: z.number().default(0),
  user_id: IdCol,

  // remove these after duplicates bug handled
  dupes: z.object({}).passthrough().default({}),
  dupe: z.number().default(0),
})
export type FieldEntry = z.infer<typeof FieldEntry>

export const routes = {
  fields_list_request: new Route({
    i: {
      e: 'fields_list_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'fields_list_response',
      s: Field,
      t: {ws: true},
    }
  }),
  fields_entries_list_request: new Route({
    i: {
      e: 'fields_entries_list_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'fields_entries_list_response',
      s: FieldEntry,
      t: {ws: true},
      keyby: 'field_id',
    }
  }),
}
