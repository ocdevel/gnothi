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
    // entries_post_response?: Api.ResUnwrap<Entries.Entry>
    // entries_put_response?: Api.ResUnwrap<Entries.Entry>
    // entries_delete_response?: Api.ResUnwrap<Entries.Entry>

    insights_books_list_response?: Api.ResUnwrap<Insights.Book>
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
    field_entries_list_response: (res: Api.ResUnwrap<z.infer<typeof r.fields_entries_list_request.o.s>>) => void
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
    const {event, code} = res

    // Set the response in its location and lastResponse, even
    // in case of error we will want to look it up
    set(produce((state) => {
      state.res[event] = res
      state.lastRes = res
    }))

    // The rest only applies to successful responses
    if (res.error) {
      return;
      // if (error == "INVALID_JWT") {
      //   return Auth.signOut()
      // }
    }

    const {keyby, op, event_as, data} = res as Api.ResSuccess
    const result: ResUnwrap<any> = {res}
    // TODO use immerjs https://docs.pmnd.rs/zustand/integrations/updating-draft-states

    // Handle special responses (redirects, key-by for arr/obj, and opts
    result.rows = data
    result.first = Array.isArray(data) ? data[0] : data
    if (keyby) {
      result.ids = _.map(data, d => _.get(d, keyby))
      result.hash = _.reduce(data, (m, v) => ({...m, [_.get(v, keyby)]: v}), {})
    } else {
      result.ids = []
      result.hash = result.first
    }
    set(produce(state => {
      state.res[event] = result
    }))

    get().hooks[event]?.(result)

    // const event_ = event_as || event
    // if (!op) {
    //   set(produce(state => {
    //     state[event].data = data
    //   }))
    //   return
    // }
    //
    // const curr = get().api[event_].data || {obj: {}, arr: []}
    // if (~['update', 'prepend', 'append'].indexOf(op)) {
    //   curr.obj = {...curr.obj, ...data.obj}
    // }
    // if (~['prepend', 'append'].indexOf(op)) {
    //   curr.arr = op === 'prepend' ? [...data.arr, ...curr.arr] : [...curr.arr, ...data.arr]
    // }
    // set(produce(state => {
    //   state.api[event_].data = curr
    // }))
  },

  clearEvents: (events) => {
  //   actions.forEach(a => {
  //     s.res[a] = null
  //     s.data[a] = null
  //   })
  },

  // Tracks actual response data
})

// Not necessary, but saves time needing to do state.data[k] || x in components