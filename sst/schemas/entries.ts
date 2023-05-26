import {z} from 'zod'
import {BoolMap, dateCol, IdCol, Passthrough} from './utils'
import {DefO, Route} from './api'
import {v4 as uuid} from "uuid";
import dayjs from "dayjs";
import {insights_books_response} from "./insights";
export * as Entries from './entries'
import {createInsertSchema} from "drizzle-zod";
import {entries} from '../services/data/schemas/entries'

// prioritize clean-text, worst-case markdown
export function getText(e: Entry): string {
  return e.text_clean || e.text
}
// prioritize summary, worst-case full-text
export function getSummary(e: Entry): string {
  return e.ai_text || getText(e)
}
export function getParas(e: Entry): string[] {
  if (e.text_paras?.length) {
    return e.text_paras
  }
  // TODO text_clean won't have paras, it's clean-join()'d, no paras preserved. This line
  // should be rare though, since text_paras is likely available by now.
  return getText(e).split(/\n+/)
}

const Entry = createInsertSchema(entries, {
  created_at: dateCol(),
  updated_at: dateCol(),
  //text: z.string().min(3) TODO revisit
})
export type Entry = z.infer<typeof Entry>
export const EntryWithTags = Entry.extend({
  tags: BoolMap
})
export type EntryWithTags = z.infer<typeof EntryWithTags>

const JustDate = z.string().regex(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)
export const Filters = z.object({
  startDate: JustDate
    .optional()
    .default(
      dayjs().subtract(3, 'years').format("YYYY-MM-DD")
    ),
  endDate: JustDate.or(z.literal("now")).default("now"),
  tags: BoolMap.default({}),
  search: z.string().optional(),
})
export type Filters = z.infer<typeof Filters>

export const entries_list_request = Filters.omit({search: true})
export type entries_list_request = z.infer<typeof entries_list_request>
export const entries_list_response = EntryWithTags
export type entries_list_response = z.infer<typeof entries_list_response>

export const entries_put_request = EntryWithTags
  .pick({
    id: true,
    title: true,
    text: true,
    created_at: true,
    tags: true
  })
export const entries_post_request = entries_put_request.omit({id: true})

export type entries_put_request = z.infer<typeof entries_put_request>
export type entries_post_request = z.infer<typeof entries_post_request>
export const entries_upsert_response = entries_list_response
export type entries_upsert_response = z.infer<typeof entries_upsert_response>

// _response will have a version without the AI inserts. _final will have all the inserts
export const entries_upsert_final = entries_upsert_response
export type entries_upsert_final = z.infer<typeof entries_upsert_final>

export const entries_delete_request = z.object({
  id: z.string()
})
export type entries_delete_request = z.infer<typeof entries_delete_request>
export const entries_delete_response = entries_delete_request
export type entries_delete_response = z.infer<typeof entries_delete_response>

export const routes = {
  entries_list_request: {
    i: {
      e: 'entries_list_request',
      s: entries_list_request,
      snoopable: true
    },
    o: {
      e: 'entries_list_response',
      s: entries_list_response,
      t: {ws: true},
      keyby: 'id'
    },
  },
  entries_put_request: {
    i: {
      e: 'entries_put_request',
      s: entries_put_request,
    },
    o: {
      e: 'entries_upsert_response',
      s: entries_upsert_response,
      t: {ws: true, background: true},
      event_as: "entries_list_response",
      keyby: 'id',
      op: "update",
    },
  },
  entries_post_request: {
    i: {
      e: 'entries_post_request',
      s: entries_post_request,
    },
    o: {
      e: 'entries_upsert_response',
      s: entries_upsert_response,
      t: {ws: true, background: true},
      event_as: "entries_list_response",
      keyby: 'id',
      op: "prepend",
    },
  },
  entries_upsert_response: {
    i: {
      e: 'entries_upsert_response',
      s: entries_upsert_response,
      t: {background: true},
    },
    o: {
      // Intermediate steps (_response, _etc) will be sent manually via
      // websockets, the final result will be pushed via _final
      e: 'entries_upsert_final',
      s: entries_upsert_final,
      t: {ws: true},
      event_as: "entries_list_response",
      keyby: 'id',
      op: "update"
    },
  },
  entries_delete_request: {
    i: {
      e: 'entries_delete_request',
      s: entries_delete_request,
      t: {ws: true},
    },
    o: {
      e: 'entries_delete_response',
      s: entries_delete_response,
      t: {ws: true},
      event_as: "entries_list_response",
      keyby: 'id',
      op: "delete"
    }
  }
}
