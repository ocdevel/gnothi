import create, {StateCreator} from 'zustand'
import {ApiSlice} from './api'
import {EventsSlice} from './events'
import {Users, Entries} from '@gnothi/schemas'
import moment from "moment-timezone";
import _ from "lodash";

interface Insights {
  days: number,
  question: string,
  themes: "kmeans" | "agglomorative",
  summarize: number,
}

export const initialInsights: Insights = {
  days: 30,
  question: "",
  themes: "kmeans",
  summarize: 300,
}

interface User {
  as: string | null,
  me: Users.users_list_response | null
  viewer: Users.users_list_response | null
}

interface SharePage {
  list?: boolean
  create?: boolean
  id?: string
}

type EntryModal = null | {
  mode: "view" | "edit"
  entry: Entries.Entry
}

export interface AppSlice {
  // ----- Insights

  insights: Insights
  setDays: (days: number) => void
  clearInsights: (k: keyof Insights | 'all') => void
  setInsight: (payload: [string, string]) => void
  // postInsight: (x: any) => Promise<void>

  // ----- User
  user: User
  setAs: (as: string | null) => void
  setUser: (user: User) => void

  // changeAs: (id: string) => Promise<void>
  profile: string | null
  setProfile: (profile: any) => void
  onAny: (a:any, b:any, c:any) => Promise<void>

  // ----- Entry
  entryModal: EntryModal
  setEntryModal: (entryModal: EntryModal) => void

  // ----- Other
  selectedTags: {[k: string]: boolean}
  fieldValues: object
  setFieldValue: (x: any) => void
  sharePage: null | SharePage
  setSharePage: (sharePage: SharePage) => void

  // ----- EE
  ee: { [k: string]: any }
  setEe: (k: string, v: any) => void
}

export const appSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice,
  [],
  [],
  AppSlice
> = (set, get) => ({

  // ----- Insights
  insights: initialInsights,
  setDays: (days) => set({days}),

  clearInsights: (k) => {
    if (k === 'all') {
      _.each(initialInsights, (v, k) => {
        set({[k]: v})
      })
    } else {
      set({[k]: initialInsights[k]})
    }
  },

  setInsight: ([k, v]) => set({[k]: v}),

  // postInsight: async (actions, k, helpers) => {
  //   const {emit} = helpers.getStoreActions().ws
  //   const {insights, ws} = helpers.getStoreState()
  //
  //   const body = { days: insights.days }
  //   const tags = trueKeys(data.selectedTags)
  //   if (tags.length) { body.tags = tags }
  //
  //   const formK = {question: "question", themes: "algo", summarize: "words"}[k]
  //   body[formK] = insights[k]
  //
  //   emit([`insights/${k}/post`, body])
  // },

  // ----- User

  user: {
    as: null,
    me: null,
    viewer: null,
  },
  setAs: (as) => set(state => ({
    user: {...state.user, as: as},
  })),

  setUser: (user) => set({user}),
  // setViewer exists in Init.tsx, since it depends on multiple
  // states being present before its logic

  // changeAs: async (actions, id, helpers) => {
  //   const {emit} = helpers.getStoreActions().ws
  //   const {data} = helpers.getStoreState().ws
  //   helpers.getStoreActions().insights.clearInsights('all')
  //
  //   actions.setAs(id)
  //   if (id) {
  //     const found = _.find(
  //       data['shares/ingress/get'],
  //       s => s?.user?.id === id
  //     )
  //     actions.setAsUser(found)
  //   } else {
  //     actions.setAsUser(null)
  //   }
  //
  //   emit(['users/user/everything', {}])
  // },

  profile: null,
  setProfile: (profile) => set({profile}),

  onAny: async (actions, res, helpers) => {
    const {emit} = helpers.getStoreActions().ws
    if (res.action !== 'users_get_response') {return}
    const user = res.data
    if (!user.timezone) {
      // Guess their default timezone (TODO should call this out?)
      const timezone = moment.tz.guess(true)
      emit(["users/timezone/put", {timezone}])
    }
    const code = localStorage.getItem("code")
    if (code && code !== user.affiliate) {
      emit(["users/affiliate/put", {affiliate: code}])
    }
  },

  // ----- Entry
  entryModal: null,
  setEntryModal: (entryModal) => set({entryModal}),

  // ----- Tags
  selectedTags: {},
  fieldValues: {},

  // ----- Fields
  setFieldValue: (payload) => {
    set({fieldValues: {...get().fieldValues, ...payload}})
  },

  // ----- Share
  // {create: bool, list: bool, group: str, ..}
  sharePage: null,
  setSharePage: (sharePage) => set({sharePage}),

  // ----- EE
  ee: {
    toolbar_groups_create: false
  },
  setEe: (k, v) => set({ee: {...get().ee, [k]: v}}),
})
