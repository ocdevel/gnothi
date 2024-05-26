import create, {StateCreator} from 'zustand'
import {AppSlice} from './app'
import _ from "lodash";
// import {Auth} from "aws-amplify";
import {ApiSlice} from "./api";
import {
  Routes,
  Events,
  Api,
  Utils,
  Tags,
  Users,
  Fields,
  Entries,
  Insights,
  Groups,
  Shares,
  Auth,
  Notes
} from '@gnothi/schemas'
import produce from 'immer'
import {Res, ResUnwrap} from "@gnothi/schemas/api";
import {z} from 'zod'
import {behaviorsSlice, BehaviorsSlice} from "./behaviors";
import {SharingSlice} from "./sharing";
import dayjs from 'dayjs'

const r = Routes.routes
// const responses = Object.fromEntries(
//   Object.entries(r).map(([k, v]) => ([v.o.e, v.o.s]))
// )
// type R = typeof responses
// type Responses = { [k in keyof R]: Api.ResUnwrap<z.infer<R[k]>> }

export interface EventsSlice {
  req: {
    [k in Events.Events]?: Api.Req
  }
  lastRes?: Api.Res,
  res: {
    users_list_response?: Api.ResUnwrap<Users.users_list_response>
    users_whoami_response?: Api.ResUnwrap<Users.users_whoami_response>
    tags_list_response?: Api.ResUnwrap<z.infer<typeof r.tags_list_request.o.s>>
    tags_post_response?: Api.ResUnwrap<Tags.tags_post_response>
    entries_list_response?: Api.ResUnwrap<Entries.entries_list_response>
    fields_list_response?: Api.ResUnwrap<z.infer<typeof r.fields_list_request.o.s>>
    fields_entries_list_response?: Api.ResUnwrap<z.infer<typeof r.fields_entries_list_request.o.s>>
    entries_upsert_response?: Api.ResUnwrap<Entries.entries_upsert_response>
    entries_delete_response?: Api.ResUnwrap<Entries.entries_delete_response>
    entries_notes_list_response?: Api.ResUnwrap<Notes.entries_notes_list_response>
    entries_notes_post_response?: Api.ResUnwrap<Notes.entries_notes_post_response>

    insights_get_response?: Api.ResUnwrap<Insights.insights_get_response>
    insights_summarize_response?: Api.ResUnwrap<Insights.insights_summarize_response>
    insights_prompt_response?: Api.ResUnwrap<Insights.insights_prompt_response>
    insights_ask_response?: Api.ResUnwrap<Insights.insights_ask_response>
    insights_themes_response?: Api.ResUnwrap<Insights.insights_themes_response>
    insights_books_response?: Api.ResUnwrap<Insights.insights_books_response>
    insights_search_response?: Api.ResUnwrap<Insights.insights_search_response>
    // insights_books_list_response?: Api.ResUnwrap<Insights.Book>

    groups_list_response?: Api.ResUnwrap<z.infer<typeof r.groups_list_request.o.s>>
    groups_get_response?: Api.ResUnwrap<z.infer<typeof r.groups_get_request.o.s>>
    groups_mine_list_response?: Api.ResUnwrap<z.infer<typeof r.groups_mine_list_request.o.s>>
    groups_members_list_response?: Api.ResUnwrap<z.infer<typeof r.groups_members_list_request.o.s>>
    // fields_entrise_list_response?: Api.ResUnwrap<Fields.FieldEntry>
    // [k in Events.Events]?: Api.ResUnwrap<any>
    notifs_groups_list_response?: Api.ResUnwrap<z.infer<typeof r.notifs_groups_list_request.o.s>>
    notifs_notes_list_response?: Api.ResUnwrap<z.infer<typeof r.notifs_notes_list_request.o.s>>
    // notifs_shares_list_response?: Api.ResUnwrap<z.infer<typeof r.notifs_shares_list_request.o.s>>
    shares_ingress_list_response?: Api.ResUnwrap<Shares.shares_ingress_list_response>
    shares_egress_list_response?: Api.ResUnwrap<Shares.shares_egress_list_response>
  }
  resBuff: EventsSlice['res']
  hooks: {
    tags_list_response: (res: Api.ResUnwrap<z.infer<typeof r.tags_list_request.o.s>>) => void
    fields_entries_list_response: BehaviorsSlice['behaviors']['fields_entries_list_response']
  }
  handleEvent: (response: Api.Res) => void

  // set_groups_messages_get_response: any
  // set_tags_get_response: any
  // set_users_profile_put: any
  // set_fields_field_entries_get: any

  clearReq: (events: Events.Events[]) => void
  clearRes: (events: Events.Events[]) => void
}

export const eventsSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice & BehaviorsSlice & SharingSlice,
  [],
  [],
  EventsSlice
> = (set, get) => ({
  lastRes: undefined,
  req: {},
  res: {},
  // buffer of responses in one event to collect, which will be flushed to res above
  resBuff: {},
  // _hooks: {
    // 'set_groups_message_get_response': action((state, data) => {
    //   const k = 'groups/messages/get'
    //   state.data[k] = [...state.data[k], data]
    // }),
  // },
  hooks: {
    tags_list_response: (res) => {
      res.first.user_id
      const selectedTags = Object.fromEntries(
        res.ids.map(id => [id, res.hash[id].selected])
      )
      set({selectedTags})
      console.log('selectedTags', selectedTags)
    },
    fields_entries_list_response: (res) => {
      get().behaviors.field_entries_list_response(res)
    },
  },

  handleEvent: (res: Api.Res) => {
    console.log(`${res.event}`, res)
    const {error, code, event} = res
    const event_as = res.event_as || res.event

    // The rest only applies to successful responses, but we still need the response for error-handling
    if (error) {
      set(produce(state => {
        state.lastRes = res
        if (!state.res[event]) {state.res[event] = {}}
        state.res[event].res = res
        if (res.clears) { state.req[res.clears] = null }
      }))
      return
    }

    const {chunk} = res

    // If we're receiving chunks, handle special
    if (chunk && chunk.i > 0) {
      const workingOn = get().resBuff[event]?.res?.requestId
      if (workingOn && workingOn !== res.requestId) {
        // We're still receiving chunks from an old batch. Eg, if the user clicks tags quickly. Disgard old-batch
        // chunks
        return
      } else {
        // We're past the first chunk (which would be "update"); append to the buffer
        res.op = "append"
      }
    }

    const {data, keyby, op} = res

    // @ts-ignore
    const current = get().resBuff[event_as] || {ids: [], hash: {}}
    let updates = {
      res,
      rows: data,
      first: Array.isArray(data) ? data[0] : data,
      hash: !keyby ? {} : _.keyBy(data, keyby),
      ids: !keyby ? [] : data.map(d => _.get(d, keyby))
    }
    if (!keyby) {
      console.warn(`No keyby for ${event_as}, ids[] and hash{} will be empty`)
    }

    if (!op) {
      // no-op. updates go through as-is
    } else {
      // order of these steps is important for reconstructing. hash/ids must come first, then rows

      // 1. Reconstruct the hash
      if (~['update', 'prepend', 'append'].indexOf(op)) {
        updates.hash = {...current.hash, ...updates.hash}
      } else if (op === 'delete') {
        // From current.hash, remove each item keyed by updates.ids. Assign to updates.hash
        updates.hash = _.omit(current.hash, updates.ids)
      }

      // 2. Reconstruct ids
      if (op === "update") {
        updates.ids = current.ids
      } else if (op === 'prepend') {
        updates.ids = [...updates.ids, ...current.ids]
      } else if (op === 'append') {
        updates.ids = [...current.ids, ...updates.ids]
      } else if (op === "delete") {
        // remove updates.ids from current.ids, assign to updates.ids
        updates.ids = current.ids.filter((id: string) => !~updates.ids.indexOf(id))
      } else {
        throw `What am I missing? op=${op}`
      }

      // 3. Reconstruct rows
      updates.rows = updates.ids.map(id => updates.hash[id])

      // 4. Leave .first and .res alone
    }
    const shouldFlush = !chunk || (chunk.i === chunk.of)
    set(produce(state => {
      state.lastRes = res

      // Then start setting the object updates
      state.resBuff[event_as] = updates
      if (shouldFlush) {
        state.res[event_as] = updates
        if (event !== event_as) {
          if (!state.res[event]) {state.res[event] = {}}
          state.res[event].res = res
        }
        if (res.clears) { state.req[res.clears] = null }
      }
    }))
    if (shouldFlush) {
      get().hooks[event_as]?.(updates)
    }
  },

  clearRes: (events) => {
    set(produce(state => {
      events.forEach(e => {
        state.res[e] = null
      })
    }))
  },
  clearReq: (events) => {
    set(produce(state => {
      events.forEach(e => {
        state.req[e] = null
      })
    }))
  }

  // Tracks actual response data
})

// Not necessary, but saves time needing to do state.data[k] || x in components
