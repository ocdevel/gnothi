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
import {BehaviorsSlice} from "./behaviors.ts";

export type View = {
  view: "new" | "list" | "view" | "edit" | null
  id: string | null
}
export interface GroupsSlice {
  groups: {
    view: View
    setView: (view: View) => void
  }
}

export const groupsSlice: StateCreator<
  AppSlice & EventsSlice & ApiSlice & GroupsSlice & SharingSlice & BehaviorsSlice,
  [],
  [],
  GroupsSlice
> = (set, get) => ({
  groups: {
    view: {
      view: null,
      id: null,
    },
    setView: (view) => set(produce((s) => {
      s.groups.view = view
    })),
  }
})
