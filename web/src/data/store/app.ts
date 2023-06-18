import create, {StateCreator} from 'zustand'
import {ApiSlice} from './api'
import {EventsSlice} from './events'
import {BehaviorsSlice} from './behaviors'
import React from 'react'
import {Users, Entries, Insights} from "@gnothi/schemas"
import {produce} from 'immer'

import dayjs from 'dayjs'
import {SharingSlice} from "./sharing";

// TODO use mainTag as default tag
export const initialFilters = Entries.entries_list_request.parse({})

interface User {
  as: string | null,
  me: Users.User | null
  viewer: Users.users_list_response | null
}

type EntryModal = null | {
  mode: "new" | "view" | "edit"
  entry?: Entries.entries_list_response
}


export interface AppSlice {
  // API response errors get handled a certain way. This is for manual error adding (eg client issues)
  errors: React.ReactNode[]
  setErrors: (error: React.ReactNode[]) => void
  addError: (error: React.ReactNode) => void

  // ----- Insights
  filters: Entries.Filters
  setFilters: (filters: Partial<Entries.Filters>) => void
  clearFilters: () => void
  // postInsight: (x: any) => Promise<void>

  // ----- User
  user: User
  setAs: (as: string | null) => void
  setUser: (user: User) => void

  modals: {
    premium: boolean
    setPremium: (show: boolean) => void
    prompt: boolean
    setPrompt: (show: boolean) => void
    entry: EntryModal
    setEntry: (entryModal: EntryModal) => void
    books: string | null
    setBooks: (view: string | null) => void
    summary: string | null
    setSummary: (view: string | null) => void
  }

  // changeAs: (id: string) => Promise<void>
  profile: string | null
  setProfile: (profile: any) => void

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
  setErrors: (errors) => set({errors}),
  addError: (error) => set({errors: [...get().errors, error]}),

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

  modals: {
    premium: false,
    setPremium: (show) => set(produce(state => {state.modals.premium = show})),
    prompt: false,
    setPrompt: (show) => set(produce(state => {state.modals.prompt = show})),

    // ----- Entry
    entry: null,
    setEntry: (entryModal) => set(produce(state => {state.modals.entry = entryModal})),

    books: null,
    setBooks: (view) => set(produce(state => {state.modals.books = view})),
    summary: null,
    setSummary: (view) => set(produce(state => {state.modals.summary = view})),
  },

  // ----- Tags
  selectedTags: {},

  // ----- EE
  // ee: {
  //   toolbar_groups_create: false
  // },
})
