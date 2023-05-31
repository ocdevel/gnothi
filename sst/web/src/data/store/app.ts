import create, {StateCreator} from 'zustand'
import {ApiSlice} from './api'
import {EventsSlice} from './events'
import {BehaviorsSlice} from './behaviors'
import React from 'react'
import {Users, Entries, Insights} from "@gnothi/schemas"

import dayjs from 'dayjs'
import {SharingSlice} from "./sharing";

// TODO use mainTag as default tag
export const initialFilters = Entries.entries_list_request.parse({})

interface User {
  as: string | null,
  me: Users.users_list_response | null
  viewer: Users.users_list_response | null
}

type EntryModal = null | {
  mode: "new" | "view" | "edit"
  entry?: Entries.entries_list_response
}

type Insight = "themes" | "summary" | "prompt" | "books" | "behaviors" | null


export interface AppSlice {
  // API response errors get handled a certain way. This is for manual error adding (eg client issues)
  errors: string[]
  setErrors: (error: React.FC[]) => void
  addError: (error: React.FC) => void

  // ----- Insights
  filters: Entries.Filters
  setFilters: (filters: Partial<Entries.Filters>) => void
  clearFilters: () => void
  setInsight: (payload: [string, string]) => void
  // postInsight: (x: any) => Promise<void>

  // ----- User
  user: User
  setAs: (as: string | null) => void
  setUser: (user: User) => void

  // changeAs: (id: string) => Promise<void>
  profile: string | null
  setProfile: (profile: any) => void
  premiumModal: boolean
  setPremiumModal: (premiumModal: boolean) => void

  // ----- Entry
  entryModal: EntryModal
  setEntryModal: (entryModal: EntryModal) => void


  // ----- Other
  selectedTags: {[k: string]: boolean}

}

export const appSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice & BehaviorsSlice & SharingSlice,
  [],
  [],
  AppSlice
> = (set, get) => ({
  // Errors
  errors: [],
  setErrors: (errors) => set(state => ({errors})),
  addError: (error) => set(state => ({errors: [...state.errors, error]})),

  // ----- Insights
  filters: initialFilters,
  setFilters: (filters) => set(state => ({
    filters: {
      ...state.filters,
      ...filters
    }
  })),

  clearFilters: () => {
    get().setFilters(initialFilters)
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
  premiumModal: false,
  setPremiumModal: (premiumModal) => set({premiumModal}),

  // ----- Entry
  entryModal: null,
  setEntryModal: (entryModal) => set({entryModal}),

  // ----- Tags
  selectedTags: {},

  // ----- EE
  // ee: {
  //   toolbar_groups_create: false
  // },
})
