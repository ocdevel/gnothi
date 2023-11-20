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
import { clearInterval as clearInterval_, clearTimeout, setInterval, setTimeout } from 'worker-timers';

function clearInterval(intervalId: number | null) {
  if (!intervalId) { return }
  try {
    clearInterval_(intervalId)
  } catch(e) {
    // worker-timers clearInterval throws instead of graceful, so just log for dev for now
    console.error(e)
  }
}

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
type TimerStatus = "work" | "pause" | "stop"
const DEFAULT_MINUTES = 25
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

    timer: {
      fid: null | string
      status: TimerStatus
      seconds: number
      minutesDesired?: number
      interval: null | number
    }
    timerActivate: (data: {fid: string, status: TimerStatus, minutesDesired: number}) => void
    // just separate function so timerActivate doesn't get too crazy
    timerFinish: () => void

    subtask: {
      addingTo: null | string
      setAddingTo: (parentId: string | null) => void
      editingId: null | string
      setEditingId: (id: string | null) => void
      // currently drilled-in subtask
      activeIds: Record<string, null | string>
      setActiveId: (parentId: string, childId: string) => void
    }
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
    },

    timer: {
      fid: null,
      seconds: 0,
      minutesDesired: undefined,
      status: "work", // work|pause -> done (waits here until they activate break) -> break -> delete
      interval: null,
    },
    // separate from nested timer object so we can clobber the timer object
    timerActivate: ({fid, status, minutesDesired=DEFAULT_MINUTES}) => {
      const curr = get().behaviors.timer

      clearInterval(curr.interval)
      if (status === "stop") {
        set(produce(s => {
          s.behaviors.timer = {fid: null, seconds: 0, status: "stop", interval: null, minutesDesired: DEFAULT_MINUTES}
        }))
        return
      }
      if (status === "pause") {
        set(produce(s => {
          s.behaviors.timer = {...s.behaviors.timer, status: "pause"}
        }))
        return
      }

      // Else start new timer. Only one timer can be active a time, so this just wipes whatever they may have going
      const interval = setInterval(() => {
        // need to get it again, since this inner function is what's kept around (not scope above)
        const curr = get().behaviors.timer
        const seconds = curr.seconds + 1
        set(produce(s => {
          // Make sure to listen deeply on s.behaviors.seconds, since we're not replacing the whole timer
          s.behaviors.timer.seconds = seconds
        }))
        if (seconds > minutesDesired * 60) {
          get().behaviors.timerFinish()
        }
      }, 1000)
      // resume or start over
      const minutesDesired_ = curr.fid === fid ? curr.minutesDesired : minutesDesired
      const seconds = (curr.fid && curr.fid === fid) ? curr.seconds : 0
      set(produce(s => {
        s.behaviors.timer = {
          fid,
          seconds,
          status: "work",
          interval,
          minutesDesired: minutesDesired_
        }
      }))
    },
    timerFinish() {
      const curr = get().behaviors.timer
      clearInterval(curr.interval)
      const fid = curr.fid!
      const currVal = get().res.fields_entries_list_response?.hash?.[fid]?.value || 0
      const newVal = currVal + 1
      get().behaviors.setValues({
        [fid]: newVal
      })
      get().send("fields_entries_post_request", {
        field_id: fid,
        value: newVal,
        // today. Even if they're nav'd back, just send for today
        day: undefined
      })
      set(produce(s => {
        s.behaviors.timer = {fid: null, seconds: 0, status: "work", interval: null, minutesDesired: DEFAULT_MINUTES}
      }))

      // Notify. For now I'm just doing default browser/OS notification, later add a sound effect & modal
      const [title, message] = ["Timer up!", "Your behavior timer is up and you gained a point."]
      // First, check if notifications are supported and granted permission
      if (!("Notification" in window)) {
        console.error("This browser does not support system notifications.");
        alert(message)
      } else if (Notification.permission === "granted") {
        // If permission is already granted
        new Notification(title, {body: message});
      } else if (Notification.permission !== "denied") {
        // Request permission if it's not denied
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(title, {body: message});
          }
        });
      }

    },

    subtask: {
      addingTo: null,
      setAddingTo: (parentId) => set(produce(state => {
        state.behaviors.subtask.addingTo = parentId
        state.behaviors.subtask.editingId = null
      })),
      editingId: null,
      setEditingId: (id) => set(produce(state => {
        state.behaviors.subtask.editingId = id
        state.behaviors.subtask.addingTo = null
      })),
      activeIds: {},
      setActiveId: (parentId, childId) => set(produce(state => {
        state.behaviosr.
        state.behaviors.subtask.active[parentId] = childId
      }))
    }
  }
})
