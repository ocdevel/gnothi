import {create} from 'zustand'
import * as S from "@gnothi/schemas"
import {StateCreator} from "zustand";
import {EventsSlice} from "./events";
import {BehaviorsSlice} from "./behaviors";
import {ApiSlice} from "./api";
import {AppSlice} from "./app";
import produce from 'immer'
import _ from "lodash";


type Id = string | null
// null means close the modal

// TODO replace this (and others) with Page & Mode, or View & Mode, or something
export type Tab = "ingress" | "egress" | "info" | null
export type Egress = "list" | "new" | "view" | "edit"
type View = {
  tab: Tab
  egress: Egress
  sid?: Id
  gid?: Id
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
      egress: "new",
      sid: null,
      gid: null
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
