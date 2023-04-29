import create from 'zustand'
import * as S from "@gnothi/schemas"
import {StateCreator} from "zustand/esm";
import {EventsSlice} from "./events";
import {BehaviorsSlice} from "./behaviors";
import {ApiSlice} from "./api";
import {AppSlice} from "./app";
import produce from 'immer'
import _ from "lodash";


type Id = string | null
// null means close the modal
export type Tab = "inbound" | "outbound" | "info" | null
export type Outbound = "new" | "view" | "edit"
type View = {
  tab: Tab
  outbound: Outbound
  sid?: Id
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
      tab: null,
      outbound: "new",
      sid: null,
      group: null
    },
    setView: (view) => set(produce(state => {
      // for keeping track of lastPage (where to close modal too), see behaviors
      state.sharing.view = {
        ...state.sharing.view,
        ...view,
      }
    })),
  }
})
