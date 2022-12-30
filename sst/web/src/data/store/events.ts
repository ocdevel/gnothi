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
  Analyze,
  Groups,
  Shares,
  Auth
} from '@gnothi/schemas'
import produce from 'immer'
import {Res, ResUnwrap} from "@gnothi/schemas/api";
import {z} from 'zod'

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
    auth_register_response?: Api.ResUnwrap<Auth.auth_register_response>
    users_list_response?: Api.ResUnwrap<Users.users_list_response>
    tags_list_response?: Api.ResUnwrap<z.infer<typeof r.tags_list_request.o.s>>
    entries_list_response?: Api.ResUnwrap<Entries.entries_list_response>
    fields_list_response?: Api.ResUnwrap<z.infer<typeof r.fields_list_request.o.s>>
    fields_entries_list_response?: Api.ResUnwrap<z.infer<typeof r.fields_entries_list_request.o.s>>
    entries_upsert_response?: Api.ResUnwrap<Entries.entries_upsert_response>
    // entries_delete_response?: Api.ResUnwrap<Entries.Entry>

    analyze_get_response?: Api.ResUnwrap<Analyze.analyze_get_response>
    analyze_summarize_response?: Api.ResUnwrap<Analyze.analyze_summarize_response>
    analyze_prompt_response?: Api.ResUnwrap<Analyze.analyze_prompt_response>
    analyze_ask_response?: Api.ResUnwrap<Analyze.analyze_ask_response>
    analyze_themes_response?: Api.ResUnwrap<Analyze.analyze_themes_response>
    analyze_books_response?: Api.ResUnwrap<Analyze.analyze_books_response>
    analyze_search_response?: Api.ResUnwrap<Analyze.analyze_search_response>

    analyze_books_list_response?: Api.ResUnwrap<Analyze.Book>
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
    fields_entries_list_response: (res: Api.ResUnwrap<Fields.fields_entries_list_response>) => void
  }
  handleEvent: (response: Api.Res) => void

  // set_groups_messages_get_response: any
  // set_tags_get_response: any
  // set_users_profile_put: any
  // set_fields_field_entries_get: any

  clearEvents: (events: Event[]) => void
}

export const eventsSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice,
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
      const obj = _.keyBy(res.rows, 'field_id')
      set({fieldValues: _.mapValues(obj, 'value')})
    },
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
      // if (error == "INVALID_JWT") {
      //   return Auth.signOut()
      // }
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
      ids: !keyby ? [] : _.map(data, d => _.get(d, keyby))
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
      }

      // 2. Reconstruct ids
      if (op === "update") {
        updates.ids = current.ids
      } else if (op === 'prepend') {
        updates.ids = [...updates.ids, ...current.ids]
      } else if (op === 'append') {
        updates.ids = [...current.ids, ...updates.ids]
      } else {
        throw "What am I missing?"
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
