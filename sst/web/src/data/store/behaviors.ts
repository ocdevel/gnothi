import create from 'zustand'
import * as S from "@gnothi/schemas"
import dayjs, {Dayjs} from 'dayjs'
import {StateCreator} from "zustand/esm";
import {EventsSlice} from "./events";
import {ApiSlice} from "./api";
import {AppSlice} from "./app";
import produce from 'immer'
import _ from "lodash";

export const fmt = 'YYYY-MM-DD'
export function iso(day?: Dayjs | string) {
  return dayjs(day).format(fmt)
}

type ShowForm = "new" | string | false
type ShowChart = "overall" | string | false
export interface BehaviorsSlice {
  behaviors: {
    values: {[k: string]: number | null}
    setValue: (x: any) => void

    day: Dayjs
    dayStr: string
    setDay: (day: Dayjs) => void
    isToday: boolean
    selectedField: S.Fields.fields_post_request | null
    showForm: ShowForm
    setShowForm: (showForm: ShowForm) => void
    showChart: ShowChart
    setShowChart: (showChart: ShowChart) => void

    fields_entries_list_response: (res: S.Api.ResUnwrap<S.Fields.fields_entries_list_response>) => void
  }
}

export const behaviorsSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice & BehaviorsSlice,
  [],
  [],
  BehaviorsSlice
> = (set, get) => ({
  behaviors: {
    values: {},
    setValue: (payload) => {
      set(produce(state => state.behaviors.values = {...state.behaviors.values, payload}))
    },

    day: dayjs(),
    dayStr: iso(),
    setDay: (day) => set(state => ({
      behaviors: {
        ...get().behaviors,
        day,
        dayStr: iso(day),
        isToday: iso() === iso(day),
      }
    })),
    isToday: true,
    selectedField: null,
    showForm: false,
    setShowForm: (showForm) => set(produce(state => {
      state.behaviors.showForm = showForm
    })),
    showChart: false,
    setShowChart: (showChart) => set(produce(state => {
      state.behaviors.showChart = showChart
    })),

    fields_entries_list_response: (res) => {
      const obj = _.keyBy(res.rows, 'field_id')
      set(produce(state => {
        state.behaviors.values = _.mapValues(obj, 'value')
      }))
    }
  }
})
