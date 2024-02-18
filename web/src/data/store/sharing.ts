import {create} from 'zustand'
import * as S from "@gnothi/schemas"
import {StateCreator} from "zustand";
import {EventsSlice} from "./events";
import {BehaviorsSlice} from "./behaviors";
import {ApiSlice} from "./api";
import {AppSlice} from "./app";
import produce from 'immer'
import _ from "lodash";
import {ShareProfileField, shares_post_request} from "../../../../schemas/shares.ts";


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

// excluding 'profile' for now since that's a client-side toggle of other fields. Revisit, need to account
// for other options we add
type ShareField = ShareProfileField & 'fields'

export interface SharingSlice {
  sharing: {
    view: View
    setView: (view: Partial<View>) => void

    form: {
      share: Record<ShareField, boolean>
      setShare: (share: Record<ShareField, boolean>) => void
      users: Record<string, boolean>
      setUsers: (users: Record<string, boolean>) => void
      tags: Record<string, boolean>
      setTags: (tags: Record<string, boolean>) => void
      groups: Record<string, boolean>
      setGroups: (groups: Record<string, boolean>) => void
      reset: (share: shares_post_request) => void
      getForm: () => shares_post_request
    }
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

    form: {
      share: {},
      setShare: (share) => set(produce(state => {
        state.sharing.form.share = share
      })),
      users: {},
      setUsers: (users) => set(produce(state => {
        state.sharing.form.users = users
      })),
      tags: {},
      setTags: (tags) => set(produce(state => {
        state.sharing.form.tags = tags
      })),
      groups: {},
      setGroups: (groups) => set(produce(state => {
        state.sharing.form.groups = groups
      })),
      reset: (s: any) => set(produce(state => {
        if (!s) {
          state.sharing.form.share = {}
          state.sharing.form.users = {}
          state.sharing.form.tags = {}
          state.sharing.form.groups = {}
          return
        }
        state.sharing.form.share = s.share
        state.sharing.form.users = s.users
        state.sharing.form.tags = s.tags
        state.sharing.form.groups = s.groups
      })),
      getForm: () => {
        const sid = get().sharing.view.sid
        const {share, users, tags, groups} = get().sharing.form
        return {id: sid, share, users, tags, groups}
      }
    }
  }
})
