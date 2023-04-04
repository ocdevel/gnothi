import {z} from 'zod'
import {Passthrough, IdCol, dateCol, CoerceNumber} from './utils'
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
]).default("ffill")

export const Field = z.object({
  //Entries that change over time. Uses:
  // * Charts
  // * Effects of sentiment, topics on entries
  // * Global trends (exercise -> 73% happiness)
  id: IdCol,

  type: FieldType,
  name: z.string(),
  // Start entries/graphs/correlations here
  created_at: dateCol().default(() => new Date()),
  // Don't actually delete fields, unless it's the same day. Instead
  // stop entries/graphs/correlations here
  excluded_at: dateCol().optional(),
  default_value: DefaultValueTypes,
  default_value_value: z.number().optional(),
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
  day: dateCol(),

  created_at: dateCol(),
  value: z.number().default(0),
  user_id: IdCol,

  // remove these after duplicates bug handled
  dupes: z.object({}).passthrough().default({}),
  dupe: z.number().default(0),
})
export type FieldEntry = z.infer<typeof FieldEntry>

export const fields_post_request = Field.pick({
  type: true,
  name: true,
  default_value: true,
  default_value_value: true,
})
export type fields_post_request = z.infer<typeof fields_post_request>

export const fields_list_request = Passthrough
export type fields_list_request = z.infer<typeof fields_list_request>
export const fields_list_response = Field
export type fields_list_response = z.infer<typeof fields_list_response>

export const fields_entries_list_request = z.object({
  day: dateCol().optional()
})
export type fields_entries_list_request = z.infer<typeof fields_entries_list_request>
export const fields_entries_list_response = FieldEntry
export type fields_entries_list_response = z.infer<typeof fields_entries_list_response>
export const fields_entries_post_request = FieldEntry.pick({
  field_id: true,
  day: true,
  value: true
})
export type fields_entries_post_request = z.infer<typeof fields_entries_post_request>
export const fields_entries_post_response = fields_entries_list_response
export type fields_entries_post_response = z.infer<typeof fields_entries_post_response>

export const routes = {
  fields_list_request: {
    i: {
      e: 'fields_list_request',
      s: fields_list_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: 'fields_list_response',
      s: fields_list_response,
      t: {ws: true},
    }
  },
  fields_post_request: {
    i: {
      e: 'fields_post_request',
      s: fields_post_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'fields_post_response',
      s: fields_list_response,
      t: {ws: true},
      event_as: 'fields_list_response',
      op: 'append'
    }
  },


  fields_entries_list_request: {
    i: {
      e: 'fields_entries_list_request',
      s: Passthrough,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: 'fields_entries_list_response',
      s: fields_entries_list_response,
      t: {ws: true},
      keyby: 'field_id',
    }
  },

  fields_entries_post_request: {
    i: {
      e: 'fields_entries_post_request',
      s: fields_entries_post_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'fields_entries_post_response',
      s: fields_entries_post_response,
      t: {ws: true},
      keyby: 'field_id',
      event_as: 'fields_entries_list_response'
    }
  },

}
