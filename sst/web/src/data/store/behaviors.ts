import {create} from 'zustand'
import * as S from "@gnothi/schemas"
import dayjs, {Dayjs} from 'dayjs'
import {StateCreator} from "zustand/esm";
import {EventsSlice} from "./events";
import {ApiSlice} from "./api";
import {AppSlice} from "./app";
import produce from 'immer'
import _ from "lodash";
import {SharingSlice} from "./sharing";

export const fmt = 'YYYY-MM-DD'
export function iso(day?: Dayjs | string) {
  // return dayjs(day).tz(myTz).format(fmt)
  return dayjs(day).format(fmt)
}

type Id = string
export type ViewPage = "entry" | "dashboard" | "modal"
export type ViewView = "new" | "overall" | "view" | "edit" | null
type View = {
  lastPage: ViewPage
  page: ViewPage
  view: ViewView
  fid: Id | null
}
export interface BehaviorsSlice {
  behaviors: {
    values: {[k: string]: number | null}
    setValue: (x: any) => void

    day: Dayjs
    dayStr: string
    setDay: (day: Dayjs) => void
    isToday: boolean

    view: View
    setView: (view: Partial<View>) => void
  }
}

export const behaviorsSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice & BehaviorsSlice & SharingSlice,
  [],
  [],
  BehaviorsSlice
> = (set, get) => ({
  behaviors: {
    values: {},
    setValue: (payload) => {
      set(produce((state) => {
        state.behaviors.values = {
          ...state.behaviors.values,
          ...payload
        }
      }))
    },

    day: dayjs(),
    dayStr: iso(),
    setDay: (day) => {
      const dayStr = iso(day)
      set(state => ({
        behaviors: {
          ...get().behaviors,
          day,
          dayStr,
          isToday: iso() === dayStr,
        }
      }))
      get().send('fields_entries_list_request', {
        day: dayStr
      })
    },
    isToday: true,

    view: {
      lastPage: "dashboard",
      page: "dashboard",
      view: null,
      fid: null
    },
    setView: (view) => set(produce(state => {
      const curr = state.behaviors.view
      state.behaviors.view = {
        ...state.behaviors.view,
        ...view,
        lastPage: (
          view.page === "modal" && ["entry", "dashboard"].includes(curr.page) ? curr.page
          : view.page),
      }
    })),
  }
})
