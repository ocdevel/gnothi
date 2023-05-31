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
  hooks: {
    tags_list_response: (res: Api.ResUnwrap<z.infer<typeof r.tags_list_request.o.s>>) => void
    fields_entries_list_response: BehaviorsSlice['behaviors']['fields_entries_list_response']
  }
  handleEvent: (response: Api.Res) => void

  // set_groups_messages_get_response: any
  // set_tags_get_response: any
  // set_users_profile_put: any
  // set_fields_field_entries_get: any

  clearEvents: (events: Events.Events[]) => void
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
  // _hooks: {
    // 'set_groups_message_get_response': action((state, data) => {
    //   const k = 'groups/messages/get'
    //   state.data[k] = [...state.data[k], data]
    // }),
    //
    // 'set_users/profile/put': action((state, data) => {
    //   data.timezone = _.find(timezones, t => t.value === data.timezone)
    //   state.data['users/profile/put'] = data
    // }),
    //

  // },
  hooks: {
    tags_list_response: (res) => {
      res.first.user_id
      const selectedTags = Object.fromEntries(
        res.ids.map(id => [id, res.hash[id].selected])
      )
      set({selectedTags})
      console.log(selectedTags)
    },
    fields_entries_list_response: (res) => {
      get().behaviors.field_entries_list_response(res)
    }
  },

  handleEvent: (res: Api.Res) => {
    console.log({res})
    const {error, code, event} = res

    // Set the response in its location and lastResponse, even
    // in case of error we will want to look it up
    set(produce(state => {
      state.lastRes = res
      if (!state.res[event]) {
        state.res[event] = {}
      }
      state.res[event].res = res
    }))

    // The rest only applies to successful responses
    if (error) {
      return;
    }

    const event_ = res.event_as || res.event
    const {data, keyby, op} = res

    // @ts-ignore
    const current = get().res[event_] || {}
    let updates = {
      res,
      rows: data,
      first: Array.isArray(data) ? data[0] : data,
      hash: !keyby ? {} : _.keyBy(data, keyby),
      ids: !keyby ? [] : data.map(d => _.get(d, keyby))
    }
    if (!keyby) {
      console.warn(`No keyby for ${event_}, ids[] and hash{} will be empty`)
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
        if (!current?.ids) {debugger}
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
    set(produce(state => {
      state.res[event_] = updates
    }))

    get().hooks[event_]?.(updates)
  },

  clearEvents: (events) => {
    set(produce(state => {
      events.forEach(e => {
        state.res[e] = null
      })
    }))
  },

  // Tracks actual response data
})

// Not necessary, but saves time needing to do state.data[k] || x in components
