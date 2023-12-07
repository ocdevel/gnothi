import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'
import {shallow} from 'zustand/shallow'
import {appSlice, AppSlice} from './app'
import {ApiSlice, apiSlice} from './api'
import {GroupsSlice, groupsSlice} from './groups'
import {behaviorsSlice, BehaviorsSlice} from './behaviors'
import {eventsSlice, EventsSlice} from "./events";
import {SharingSlice, sharingSlice} from "./sharing";

export const useStore = create<
  AppSlice & ApiSlice & EventsSlice & BehaviorsSlice & SharingSlice & GroupsSlice
>()(subscribeWithSelector((...a) => ({
  ...eventsSlice(...a),
  ...apiSlice(...a),
  ...appSlice(...a),
  ...behaviorsSlice(...a),
  ...sharingSlice(...a),
  ...groupsSlice(...a)
})))
