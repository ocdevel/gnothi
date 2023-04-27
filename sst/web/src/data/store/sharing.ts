import create from 'zustand'
import * as S from "@gnothi/schemas"
import {StateCreator} from "zustand/esm";
import {EventsSlice} from "./events";
import {BehaviorsSlice} from "./behaviors";
import {ApiSlice} from "./api";
import {AppSlice} from "./app";
import produce from 'immer'
import _ from "lodash";


type Id = string
//export type ViewPage = "entry" | "dashboard" | "modal"
export type ViewView = "new" | "view" | "edit" | null
type View = {
  //lastPage: ViewPage
  page: any //ViewPage
  view: ViewView
  sid: Id | null
  group?: Id
}
export interface SharingSlice {
  sharing: {
    view: View
    setView: (view: Partial<View>) => void
  }
}

export const sharingSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice & BehaviorsSlice & SharingSlice,
  [],
  [],
  SharingSlice
> = (set, get) => ({
  sharing: {
    view: {
      //lastPage: "dashboard",
      page: "dashboard",
      view: null,
      sid: null,
      group: undefined
    },
    setView: (view) => set(produce(state => {
      const curr = state.sharing.view
      state.sharing.view = {
        ...state.sharing.view,
        ...view,
        lastPage: (
          view.page === "modal" && ["entry", "dashboard"].includes(curr.page) ? curr.page
          : view.page),
      }
    })),
  }
})
