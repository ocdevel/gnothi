import {create} from 'zustand'
import * as S from "@gnothi/schemas"
import dayjs, {Dayjs} from 'dayjs'
import {StateCreator} from "zustand";
import {EventsSlice} from "./events";
import {ApiSlice} from "./api";
import {AppSlice} from "./app";
import produce from 'immer'
import _ from "lodash";
import {SharingSlice} from "./sharing";
import {fields_entries_list_response, fields_post_request} from "../../../../schemas/fields.ts";

export const fmt = 'YYYY-MM-DD'
export function iso(day?: Dayjs | string) {
  // return dayjs(day).tz(myTz).format(fmt)
  return dayjs(day).format(fmt)
}

type Id = string
export type ViewPage = "entry" | "dashboard" | "modal"
export type ViewView = "new" | "overall" | "view" | "edit" | null
type View = {
  view: ViewView
  fid: Id | null
}
export interface BehaviorsSlice {
  behaviors: {
    values: {[k: string]: number | null}
    setValues: (x: Record<string, any>) => void

    day: Dayjs
    dayStr: string
    setDay: (day: Dayjs) => void
    isToday: boolean

    view: View
    setView: (view: Partial<View>) => void

    field_entries_list_response: (res: fields_entries_list_response) => void

    destroy: (fid?: string, cb?: () => void) => void
  }
}

export const behaviorsSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice & BehaviorsSlice & SharingSlice,
  [],
  [],
  BehaviorsSlice
> = (set, get) => ({
  behaviors: {
    // maintained here instead of useState in behaviors/list/entry.tsx, so that server response can modify this too.
    values: {},
    setValues: (payload) => {
      set(produce((state) => {
        state.behaviors.values = {
          ...state.behaviors.values,
          ...payload
        }
      }))
    },
    field_entries_list_response(res: field_entries_list_response) {
      // on change, especially via the DayChanger, re-set the "form" values for behaviors/list/entry.tsx
      const rows = res.rows?.map(r => [r.field_id, r.value]) || []
      get().behaviors.setValues(Object.fromEntries(rows))
    },


    day: dayjs(),
    dayStr: iso(),
    setDay: (day) => {
      const dayStr = iso(day)
      set(produce(state => {
        state.behaviors.day = day
        state.behaviors.dayStr = dayStr
        state.behaviors.isToday = iso() === dayStr
        // start it over, since hook->setValues will merge (not accounting for lacking FE on new day)
        state.behaviors.values = {}
      }))
      get().send('fields_entries_list_request', {
        day: dayStr
      })
    },
    isToday: true,

    view: {
      view: null,
      fid: null
    },
    setView: (view) => set(produce(state => {
      state.behaviors.view = {
        ...state.behaviors.view,
        ...view,
      }
    })),

    destroy: (id, cb) => {
      if (!id) {return}
      if (!window.confirm("Delete this Behavior? This will delete all data for this field.")) {
        return
      }
      // eg an onClose handler, etc.
      cb && cb()
      get().send('fields_delete_request', {id})
    }
  }
})
